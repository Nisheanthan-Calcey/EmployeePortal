import { IDepartment } from '../department/department.interface';

export interface IDesignation {
    id: string;
    name: string;
    department: IDepartment;
}
