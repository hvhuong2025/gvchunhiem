
/**
 * HE THONG QUAN LY LOP HOC - BACKEND (SECURE VERSION)
 * ---------------------------------------------------
 * Cấu hình bảo mật:
 * 1. Đặt SECRET_KEY bên dưới thành một chuỗi ngẫu nhiên, mạnh.
 * 2. Deploy lại Web App (Execute as: Me, Who has access: Anyone).
 * 3. Copy URL và SECRET_KEY nhập vào trang Settings của Web App.
 */

const SECRET_KEY = "HOANGHUONG2026"; // <--- DA CAP NHAT KEY

// --- 1. CONFIGURATION & SCHEMA ---
const SCHEMA = {
  Users: ['id', 'username', 'password', 'fullName', 'role', 'linkedStudentId', 'avatarUrl', 'createdAt'],
  Classes: ['id', 'className', 'schoolYear', 'homeroomTeacher', 'note', 'grade'],
  Students: ['id', 'classId', 'fullName', 'dob', 'gender', 'studentCode', 'address', 'parentId', 'status', 'xp', 'level', 'avatarUrl'],
  Parents: ['id', 'fullName', 'phone', 'email', 'relationship', 'studentId'],
  Attendance: ['id', 'classId', 'studentId', 'date', 'status', 'note'],
  Behavior: ['id', 'studentId', 'classId', 'date', 'type', 'content', 'points'],
  Announcements: ['id', 'classId', 'title', 'content', 'target', 'pinned', 'createdAt'],
  Documents: ['id', 'classId', 'title', 'url', 'category', 'createdAt'],
  Tasks: ['id', 'classId', 'title', 'description', 'dueDate', 'requireReply', 'createdAt'],
  TaskReplies: ['id', 'taskId', 'studentId', 'parentId', 'replyText', 'attachmentsJson', 'createdAt'],
  MessageThreads: ['id', 'threadKey', 'participantsJson', 'lastMessageAt'],
  Messages: ['id', 'threadId', 'fromRole', 'content', 'createdAt'],
  Questions: ['id', 'type', 'content', 'optionsJson', 'correctAnswerJson', 'points'],
  Settings: ['key', 'value', 'description', 'updatedAt'],
  Logs: ['id', 'action', 'userId', 'details', 'timestamp']
};

// --- 2. MAIN HANDLERS ---

function doGet(e) {
  return createJSONOutput({ 
    ok: true, 
    message: "Hệ thống Backend đang hoạt động. Vui lòng sử dụng POST với API Key." 
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    if (!e.postData || !e.postData.contents) {
      return createJSONOutput({ ok: false, error: "No data received" });
    }

    const request = JSON.parse(e.postData.contents);
    const { apiKey, action, data } = request;

    // 1. Security Check
    if (!apiKey || apiKey !== SECRET_KEY) {
      return createJSONOutput({ ok: false, error: "Unauthorized: Invalid API Key" });
    }

    // 2. Routing
    if (action === 'ping') {
      return createJSONOutput({ ok: true, data: "pong" });
    }
    
    // NEW: Batch Sync Action
    // IMPORTANT: This block prevents "Unknown table: data" error.
    if (action === 'data.syncAll') {
       const result = handleSyncAll();
       return createJSONOutput({ ok: true, data: result });
    }

    // Determine if Write Operation for Locking
    let isWrite = false;
    if (action === 'auth.register' || action === 'auth.login') isWrite = true; // Login implies potential write for seeding
    else if (action.includes('.create') || action.includes('.update') || action.includes('.delete')) isWrite = true;

    if (isWrite) {
      if (!lock.tryLock(10000)) {
        return createJSONOutput({ ok: false, error: "Server busy, please try again." });
      }
    }

    let result = null;

    if (action.startsWith('auth.')) {
      result = handleAuth(action, data);
    } else {
      const parts = action.split('.');
      if (parts.length !== 2) throw new Error("Invalid action format");
      
      const tableKey = mapTableKey(parts[0]);
      const method = parts[1];
      
      if (SCHEMA[tableKey]) {
        result = handleCRUD(tableKey, method, data);
      } else {
        throw new Error(`Unknown table: ${parts[0]}`);
      }
    }

    return createJSONOutput({ ok: true, data: result });

  } catch (err) {
    return createJSONOutput({ ok: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- 3. BUSINESS LOGIC ---

// NEW: Optimized Sync Function
function handleSyncAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  
  // Define map between Frontend Cache Keys and Backend Sheet Names
  const syncMap = {
    'users': 'Users',
    'classes': 'Classes',
    'students': 'Students',
    'parents': 'Parents',
    'attendance': 'Attendance',
    'behaviors': 'Behavior', // Note: frontend calls it 'behaviors', sheet is 'Behavior'
    'announcements': 'Announcements',
    'documents': 'Documents',
    'tasks': 'Tasks',
    'taskReplies': 'TaskReplies',
    'threads': 'MessageThreads',
    'messages': 'Messages',
    'questions': 'Questions'
  };
  
  // Read all sheets sequentially but in one request
  Object.keys(syncMap).forEach(key => {
     const sheetName = syncMap[key];
     const sheet = getSheet(ss, sheetName);
     result[key] = readAll(sheet);
  });
  
  return result;
}

function handleAuth(action, payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet(ss, 'Users');
  const users = readAll(sheet);
  
  if (action === 'auth.login') {
    const { username, password } = payload;
    
    // --- BOOTSTRAPING ADMIN ---
    // Automatically create default admin if DB is empty and credentials match default
    if (users.length === 0 && username === 'admin' && password === '123') {
       const adminUser = {
         id: Utilities.getUuid(),
         username: 'admin',
         password: '123',
         fullName: 'Quản Trị Viên',
         role: 'ADMIN',
         createdAt: new Date().toISOString()
       };
       appendRow(sheet, adminUser);
       return adminUser;
    }
    // --------------------------

    const user = users.find(u => 
      String(u.username).trim() === String(username).trim() && 
      String(u.password).trim() === String(password).trim()
    );
    return user || null;
  }
  
  if (action === 'auth.register') {
    const { username } = payload;
    if (users.find(u => String(u.username).trim() === String(username).trim())) {
      throw new Error("Tên đăng nhập đã tồn tại");
    }
    const newUser = { 
      ...payload, 
      id: payload.id || Utilities.getUuid(), 
      createdAt: new Date().toISOString() 
    };
    appendRow(sheet, newUser);
    return newUser;
  }
}

function handleCRUD(sheetName, method, payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet(ss, sheetName);

  if (method === 'list') {
    return readAll(sheet);
  }
  
  if (method === 'create') {
    const newItem = { ...payload };
    if (!newItem.id) newItem.id = Utilities.getUuid();
    if (SCHEMA[sheetName].includes('createdAt') && !newItem.createdAt) {
      newItem.createdAt = new Date().toISOString();
    }
    appendRow(sheet, newItem);
    return newItem;
  }
  
  if (method === 'update') {
    if (!payload.id) throw new Error("Missing ID for update");
    return updateRow(sheet, payload.id, payload);
  }
  
  if (method === 'delete') {
    if (!payload.id) throw new Error("Missing ID for delete");
    const success = deleteRow(sheet, payload.id);
    return { id: payload.id, deleted: success };
  }
  
  throw new Error(`Unknown method: ${method}`);
}

// --- 4. SHEET HELPERS ---

function getSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    // Auto init if missing
    sheet = ss.insertSheet(name);
    const headers = SCHEMA[name];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }
  }
  return sheet;
}

function getHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function readAll(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const headers = getHeaders(sheet);
  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  
  return data.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      if(header) {
         let val = row[index];
         if (val instanceof Date) val = val.toISOString();
         item[header] = val === "" ? null : val;
         if (val !== null) item[header] = val;
      }
    });
    return item;
  });
}

function appendRow(sheet, item) {
  const headers = getHeaders(sheet);
  const rowData = headers.map(header => {
    const val = item[header];
    return val === undefined || val === null ? '' : val;
  });
  sheet.appendRow(rowData);
}

function updateRow(sheet, id, item) {
  const headers = getHeaders(sheet);
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) throw new Error("Column 'id' not found");

  const data = sheet.getDataRange().getValues();
  for(let i = 1; i < data.length; i++) {
     if (String(data[i][idIndex]) === String(id)) {
       const rowIndex = i + 1;
       const newRowData = headers.map(header => {
         if (item.hasOwnProperty(header)) {
            return item[header] === undefined || item[header] === null ? '' : item[header];
         }
         return data[i][headers.indexOf(header)];
       });
       sheet.getRange(rowIndex, 1, 1, headers.length).setValues([newRowData]);
       return item;
     }
  }
  throw new Error("Item not found: " + id);
}

function deleteRow(sheet, id) {
  const headers = getHeaders(sheet);
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) throw new Error("Column 'id' not found");
  const data = sheet.getDataRange().getValues();
  for(let i = 1; i < data.length; i++) {
     if (String(data[i][idIndex]) === String(id)) {
       sheet.deleteRow(i + 1);
       return true;
     }
  }
  return false;
}

function mapTableKey(key) {
  const mapping = {
    'users': 'Users', 'classes': 'Classes', 'students': 'Students',
    'parents': 'Parents', 'attendance': 'Attendance', 'behavior': 'Behavior',
    'announcements': 'Announcements', 'documents': 'Documents', 'tasks': 'Tasks',
    'taskReplies': 'TaskReplies', 'messageThreads': 'MessageThreads', 'messages': 'Messages',
    'questions': 'Questions', 'settings': 'Settings', 'logs': 'Logs'
  };
  return mapping[key] || (key.charAt(0).toUpperCase() + key.slice(1)); 
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
