import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from } from 'rxjs';

import { DatabaseService } from './shared/database.service';
import { ApiHeaderService } from './shared/apiHeader.service';
import { NetConnectionService } from './shared/connection.service';
import { DepartmentService } from './department.service';
import { DesignationService } from './designation.service';
import { SkillService } from './skill.service';

import { IEmployee, IContact, IAddress } from 'src/components/employee/employee.interface';

@Injectable()
export class EmployeeService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Employees';
    private headers = this.headerService.header;
    private employeeList: IEmployee[];
    private employeeArray: IEmployee[];

    constructor(private http: HttpClient,
                private headerService: ApiHeaderService,
                private connectionService: NetConnectionService,
                private databaseService: DatabaseService,
                private sqlitePorter: SQLitePorter,
                private departmentService: DepartmentService,
                private designationService: DesignationService,
                private skillService: SkillService) {}

    getEmployees(): IEmployee[] {
        this.connectionService.getConnectionState().subscribe((online) => {
            if (online) {
                console.log('ONLINE');
                const employeesFromAPI = this.http.get<any[]>(`${this.ROOT_URL}` , { headers: this.headers});
                employeesFromAPI.subscribe(data => {Object.values(data)
                                    .map(values => this.employeeList = values),
                                    console.log('Employees from API: ', this.employeeList),
                                    this.updateLocalDb(this.employeeList); },
                            error => {
                                console.log(error);
                                alert('Error on API, Trying to fetch Employees from Database');
                                this.employeeList = this.employeesFromDB();
                            });
            } else {
                console.log('OFFLINE');
                this.employeeList = this.employeesFromDB();
            }
        });
        return this.employeeList;
    }

    employeesFromDB(): IEmployee[] {
        const employeesFromDB = this.databaseService.database.executeSql('SELECT * FROM employee', []);
        const employees: IEmployee[] = [];
        employeesFromDB.then((data) => {
            if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                    const depId = data.rows.item(i).department;
                    const desId = data.rows.item(i).designation;
                    this.departmentService.getDepartment(depId).then((dep) => {
                        this.designationService.getDesignation(desId).then((des) => {
                                employees.push({
                                    id: data.rows.item(i).id,
                                    firstName: data.rows.item(i).firstName,
                                    lastName: data.rows.item(i).lastName,
                                    fullName: data.rows.item(i).fullName,
                                    displayName: data.rows.item(i).displayName,
                                    startDate: data.rows.item(i).startDate,
                                    resignationDate: data.rows.item(i).resignationDate,
                                    resignationReason: data.rows.item(i).resignationReason,
                                    email: data.rows.item(i).email,
                                    employeeContactInfo: data.rows.item(i).employeeContactInfo,
                                    department: dep[0],
                                    designation: des[0],
                                    skills: data.rows.item(i).skills,
                                    currentProjects: data.rows.item(i).currentProjects
                                });
                            });
                    });
                }
                console.log('Employees from DB: ', employees);
            }
        });
        return employees;
    }

    selectedEmployee(id: IEmployee['id']): Observable<any> {
       return new Observable<any>(observer => {
        this.connectionService.getConnectionState().subscribe(online => {
            if (online) {
                let selEmp: IEmployee[];
                this.http.get<any[]>(`${this.ROOT_URL}/${id}`, {headers: this.headers}).subscribe(data => {
                    Object.values(data).map(emp => { selEmp = emp; });
                    observer.next(selEmp);
                    observer.complete();
                });
            } else {
                from(this.databaseService.database.executeSql('SELECT * FROM employee WHERE id = ?', [id]).then(data => {
                    let selEmp: IEmployee;
                    if (data.rows.length > 0) {
                        selEmp =  data.rows.item(0);
                        const depId = selEmp.department;
                        const desId = selEmp.designation;
                        const skillIds = data.rows.item(0).skills;
                        this.getEmpContact(selEmp.id).then((con) => {
                            selEmp.employeeContactInfo = con[0];
                            this.departmentService.getDepartment(depId).then((dep) => {
                                selEmp.department = dep[0];
                                this.designationService.getDesignation(desId).then((des) => {
                                    selEmp.designation = des[0];
                                    const skills = [];
                                    if (skillIds) {
                                        const skillid = skillIds.split(',');
                                        for (const e of skillid) {
                                            this.skillService.getSkill(e).then(val => {
                                                Object.values(val).map(skill => {
                                                   skills.push(skill);
                                                });
                                            });
                                        }
                                    }
                                    selEmp.skills = skills;
                                    observer.next(selEmp) ;
                                    observer.complete();
                                });
                            });
                        });
                    } else {
                        observer.next(selEmp) ;
                        observer.complete();
                    }
                }));
            }
        });
      });
    }

    addNewEmployee(employee: IEmployee): Observable<IEmployee[]> {
        let addNewEmp: Observable<IEmployee[]>;
        this.connectionService.getConnectionState().subscribe(online => {
            if (online) {
                addNewEmp = this.http.post<IEmployee[]>(`${this.ROOT_URL}` , employee, { headers: this.headers});
            } else {
                const e: any = employee;
                // tslint:disable-next-line:max-line-length
                if (e.firstName && e.lastName && e.fullName && e.email && e.startDate && e.department && e.designation) {
                    const skillId = [];
                    if (e.skills) {
                        e.skills.forEach(element => {
                            skillId.push(element.id);
                        });
                    }
                    const id = require('uuid/v4');
                    const conId = id();
                    // tslint:disable-next-line:max-line-length
                    const query = 'INSERT INTO employee (id,firstName,lastName,fullName,displayName,startDate,resignationDate,resignationReason,email,employeeContactInfo,department,designation,skills,currentProjects) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
                    // tslint:disable-next-line:max-line-length
                    const newEmp = [id(), e.firstName, e.lastName, e.fullName, e.displayName, e.startDate, e.resignationDate, e.resignationReason, e.email, conId, e.department, e.designation, skillId, e.currentProjects];
                    addNewEmp = from(this.databaseService.database.executeSql(query, newEmp).then((data) => {
                            if (data.rowsAffected === 1) {
                                const contact = e.employeeContactInfo;
                                const address = `${contact.address.number},${contact.address.street},${contact.address.city}`;
                                const sql = 'INSERT INTO contactInfo (id, empId, homePhone, mobilePhone, address) VALUES (?,?,?,?,?)';
                                const newContact = [conId, e.id, contact.homePhone, contact.mobilePhone, address];
                                this.databaseService.database.executeSql(sql, newContact).then(_ => {
                                    console.log('Added');
                                });
                                this.employeeList = this.employeesFromDB();
                            }
                            return this.employeeList;
                    }));
                } else {
                    alert ('Indicated Fields are Mandatory');
                }
            }
        });
        return addNewEmp;
    }

    updateEmployee(employee: IEmployee): Observable<void> {
        let editEmp: Observable<void>;
        this.connectionService.getConnectionState().subscribe(online => {
            if (online) {
                editEmp = this.http.put<void>(`${this.ROOT_URL}/${employee.id}`, employee, { headers: this.headers});
            } else {
                const emp: any = employee;
                const id = JSON.stringify(emp.id);
                const keys = Object.keys(emp);
                const values = Object.values(emp);
                for (let i = 1; i < keys.length; i++) {
                    let newValue: any;
                    if (keys[i] === 'employeeContactInfo') {
                        const contact: IContact = emp.employeeContactInfo;
                        for (let k = 1; k < Object.keys(contact).length; k++) {
                            let val: any;
                            if (Object.keys(contact)[k] === 'address') {
                                const address: IAddress = contact.address;
                                const add = `${address.number},${address.street},${address.city}`;
                                val = [add];
                            } else {
                                val = [Object.values(contact)[k]];
                            }
                            const sql = `UPDATE contactInfo SET ${Object.keys(contact)[k]} = ? WHERE id = ${JSON.stringify(contact.id)}`;
                            this.databaseService.database.executeSql(sql, val).then(data => {
                                if (data.rowsAffected === 1) {
                                    console.log('editing employee contact info');
                                }
                            });
                        }
                        newValue = [contact.id];
                    } else {
                        newValue = [values[i]];
                    }
                    const query = `UPDATE employee SET ${keys[i]} = ? WHERE id = ${id}`;
                    editEmp = from(this.databaseService.database.executeSql(query, newValue).then(data => {
                            if (data.rowsAffected === 1) {
                                this.employeeList = this.employeesFromDB();
                            }
                    }));
                }
            }
        });
        return editEmp;
    }

    delEmployee(id: IEmployee['id']): Observable<void> {
        let delEmp: Observable<void>;
        this.connectionService.getConnectionState().subscribe(online => {
            if (online) {
                delEmp = this.http.delete<void>(`${this.ROOT_URL}/${id}?force=true`, { headers: this.headers});
            } else {
                delEmp = from(this.databaseService.database.executeSql('DELETE FROM employee WHERE id = ?', [id]).then(data => {
                                this.databaseService.database.executeSql('DELETE FROM contactInfo WHERE empId = ?', [id]).then(_ => {
                                    this.employeeList = this.employeesFromDB();
                                });
                }));
            }
        });
        return delEmp;
    }

    updateLocalDb(empArray: IEmployee[]) {
        const emp = [];
        for (const em of empArray) {
            const emplo = this.selectedEmployee(em.id);
            emplo.subscribe(data => { emp.push(data);
                                      this.employeeArray = emp;
                                     },
                            error => console.log(error)
                            );
        }
        setTimeout(() => {
            if (this.employeeArray && this.employeeArray.length) {
                const newEmpArray = this.employeeArray.map((item) => {
                    const skills = [];
                    if (item.skills) {
                        item.skills.forEach(skill => {
                            skills.push(skill.skillId);
                        });
                    }
                    return {...item,
                            department: item.department.id,
                            designation: item.designation.id,
                            employeeContactInfo: item.employeeContactInfo.id,
                            skills
                    };
                });

                const modifiedJson = {
                        structure : {
                            tables: {
                                employee: `([id] PRIMARY KEY,
                                    [firstName],
                                    [lastName],
                                    [fullName],
                                    [displayName],
                                    [startDate],
                                    [resignationDate],
                                    [resignationReason],
                                    [email],
                                    [employeeContactInfo],
                                    [department],
                                    [designation],
                                    [skills],
                                    [currentProjects],
                                    [employmentPromotion],
                                    [employmentHistory],
                                    [futureProjects],
                                    [managedProjects],
                                    [notes],
                                    [projectAllocationHistory])`
                            },
                            otherSQL: [
                                'CREATE UNIQUE INDEX EMPID ON employee(id)'
                            ]
                        },
                        data: {
                            inserts: {
                                employee: newEmpArray
                            }
                        }
                    };
                this.sqlitePorter.importJsonToDb(this.databaseService.database, modifiedJson);

                this.updateContactTable(this.employeeArray);
            } else {
                console.log('error');
            }
        }, 2000);
    }

    updateContactTable(empArray) {
        const contactInfoArray = empArray.map((item) => {
            const add = item.employeeContactInfo.address;
            const address = `${add.number},${add.street},${add.city}`;
            return {
                ...item.employeeContactInfo,
                id: item.employeeContactInfo.id,
                empId: item.id,
                address
            };
        });

        const modifiedJson = {
            structure: {
                tables: {
                    contactInfo: `([id] PRIMARY KEY, [empId], [homePhone], [mobilePhone], [address])`
                }
            },
            data: {
                inserts: {
                    contactInfo: contactInfoArray
                }
            }
        };
        this.sqlitePorter.importJsonToDb(this.databaseService.database, modifiedJson);
    }

    getEmpContact(empID): Promise<IContact[]> {
        const contactInfoFromDB: IContact[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM contactInfo WHERE empId = ?', [empID]).then(data => {
            if (data.rows.length > 0) {
                contactInfoFromDB.push({
                    id: data.rows.item(0).id,
                    homePhone: data.rows.item(0).homePhone,
                    mobilePhone: data.rows.item(0).mobilePhone,
                    address: {
                        number: data.rows.item(0).address.split(',')[0],
                        street: data.rows.item(0).address.split(',')[1],
                        city: data.rows.item(0).address.split(',')[2]
                    }
                });
            }
            return contactInfoFromDB;
        });
    }
}
