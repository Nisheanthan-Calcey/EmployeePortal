import { IDepartment } from '../department/department.interface';

export interface ISkills {
    skillId: string;
    name: string;
    department: IDepartment;
}
