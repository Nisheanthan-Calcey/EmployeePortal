import { IDepartment } from '../department/department.interface';
import { IDesignation } from '../designation/designation.interface';
import { ISkills } from '../skill/skill.interface';

export interface IEmployee {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    displayName: string;
    startDate: string;
    resignationDate: string;
    resignationReason: string;
    email: string;
    employeeContactInfo: IContact;
    department: IDepartment;
    designation: IDesignation;
    skills: ISkills[];
    currentProjects: IProjects[];
}

export interface IContact {
    id: string;
    mobilePhone: string;
    homePhone: string;
    address: IAddress;
}

export interface IAddress {
    number: string;
    street: string;
    city: string;
}

export interface IProjects {
    id: string;
    projectRole: {
        id: string;
        name: string;
    };
    startDate: string;
    endDate: string;
    allocation: number;
    billingPercentage: number;
    billingDescription: string;
}
