
import { GoogleProvider } from '../providers/googleProvider';
import { IDataProvider } from './dataProvider';

// Switch to GoogleProvider for GAS synchronization
const provider: IDataProvider = new GoogleProvider();

export default provider;
