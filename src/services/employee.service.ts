import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from, forkJoin } from 'rxjs';

import { DatabaseService } from './shared/database.service';
import { ApiHeaderService } from './shared/apiHeader.service';
import { NetConnectionService, ConnectionStatus } from './shared/connection.service';
import { DepartmentService } from './department.service';
import { DesignationService } from './designation.service';
import { SkillService } from './skill.service';

import { IEmployee, IContact, IAddress } from 'src/components/employee/employee.interface';

@Injectable()
export class EmployeeService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Employees';
    private headers = this.headerService.header;
    private dbEmployeeList: IEmployee[];
    private serverEmployeeList: IEmployee[];
    private employeeArray: IEmployee[];

    constructor(
        private http: HttpClient,
        private headerService: ApiHeaderService,
        private connectionService: NetConnectionService,
        private databaseService: DatabaseService,
        private sqlitePorter: SQLitePorter,
        private departmentService: DepartmentService,
        private designationService: DesignationService,
        private skillService: SkillService) { }

    employeesFromServer(): Observable<IEmployee[]> {
        return new Observable(observer => {
            let employees: IEmployee[];
            this.http.get<any[]>(`${this.ROOT_URL}`, { headers: this.headers }).subscribe(data => {
                Object.values(data)
                    .map(values => employees = values);
                console.log('Employees from Server: ', employees);
                this.updateLocalDb(employees);
                observer.next(employees);
                observer.complete();
            },
                error => {
                    alert('Error on API');
                    observer.error(error);
                });
        });
    }

    employeesFromDB(): Promise<IEmployee[]> {
        const employees: IEmployee[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM employee', []).then(async (data) => {
            if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                    const depId = data.rows.item(i).department;
                    const desId = data.rows.item(i).designation;
                    await this.departmentService.getDepartment(depId).then(async (dep) => {
                        await this.designationService.getDesignation(desId).then(async (des) => {
                            await employees.push({
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
            return employees;
        });
    }

    searchEmployee(searchText: string): Observable<any[]> {
        return new Observable(observer => {
            let emp: any[] = [];
            if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
                this.http.get<any[]>(`${this.ROOT_URL}/Search?SearchString=${searchText}`, { headers: this.headers }).subscribe(results => {
                    Object.values(results).map(values => { emp = values; });
                    observer.next(emp);
                    observer.complete();
                });
            } else {
                from(this.databaseService.database.executeSql(`SELECT id,fullName,displayName FROM employee
                    WHERE fullName LIKE '%${searchText}%'`, []).then(data => {
                    if (data.rows.length) {
                        for (let i = 0; i < data.rows.length; i++) {
                            emp.push({
                                id: data.rows.item(i).id,
                                fullName: data.rows.item(i).fullName,
                                displayName: data.rows.item(i).displayName
                            });
                        }
                    }
                    observer.next(emp);
                    observer.complete();
                }));
            }
        });
    }

    selectedEmployee(id: IEmployee['id']): Observable<any> {
        return new Observable<any>(observer => {
            if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
                let selEmp: IEmployee[];
                this.http.get<any[]>(`${this.ROOT_URL}/${id}`, { headers: this.headers }).subscribe(data => {
                    Object.values(data).map(emp => { selEmp = emp; });
                    observer.next(selEmp);
                    observer.complete();
                });
            } else {
                from(this.databaseService.database.executeSql('SELECT * FROM employee WHERE id = ?', [id]).then(data => {
                    let selEmp: IEmployee;
                    if (data.rows.length > 0) {
                        selEmp = data.rows.item(0);
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
                                    observer.next(selEmp);
                                    observer.complete();
                                });
                            });
                        });
                    } else {
                        observer.next(selEmp);
                        observer.complete();
                    }
                }));
            }
        });
    }

    addEmpToServer(employee) {
        this.http.post<IEmployee[]>(`${this.ROOT_URL}`, employee, { headers: this.headers })
            .subscribe(e => {
                const newId = Object.values(e)[0];
                const query = `UPDATE employee SET id = ? WHERE id = ${JSON.stringify(employee.id)}`;
                this.databaseService.database.executeSql(query, [newId]).then(val => {
                    if (val.rowsAffected === 1) {
                        this.employeesFromDB().then(emp => {
                            this.dbEmployeeList = emp;
                        });
                    } else {
                        console.log('Error on Changing ID in DB');
                    }
                });
                this.employeesFromServer().subscribe(emp => {
                    this.serverEmployeeList = emp;
                });
            },
                error => console.log('Error on Adding DB Emp to server'));
    }

    addEmpToDB(employee: IEmployee): Observable<IEmployee[]> {
        let addNewEmp: Observable<IEmployee[]>;
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
            const newEmp = [e.id, e.firstName, e.lastName, e.fullName, e.displayName, e.startDate, e.resignationDate, e.resignationReason, e.email, conId, e.department, e.designation, skillId, e.currentProjects];
            addNewEmp = from(this.databaseService.database.executeSql(query, newEmp).then((data) => {
                if (data.rowsAffected === 1) {
                    const contact = e.employeeContactInfo;
                    const address = `${contact.address.number},${contact.address.street},${contact.address.city}`;
                    const sql = 'INSERT INTO contactInfo (id, empId, homePhone, mobilePhone, address) VALUES (?,?,?,?,?)';
                    const newContact = [conId, e.id, contact.homePhone, contact.mobilePhone, address];
                    this.databaseService.database.executeSql(sql, newContact).then(_ => {
                        console.log('Emp Added to DB');
                    });
                    this.employeesFromDB().then(afterAdd => {
                        this.dbEmployeeList = afterAdd;
                    });
                }
                return this.dbEmployeeList;
            }));
            if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
                this.addEmpToServer(employee);
            }
        } else {
            alert('Indicated Fields are Mandatory');
        }
        return addNewEmp;
    }

    updateEmployee(employee: IEmployee): Observable<void> {
        let editEmp: Observable<void>;
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
                            console.log('Editing employee contact info');
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
                    this.employeesFromDB().then(afterEdit => {
                        this.dbEmployeeList = afterEdit;
                    });
                }
            }));
        }
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.http.put<void>(`${this.ROOT_URL}/${employee.id}`, employee, { headers: this.headers }).
                subscribe(server => console.log('Editted in server'),
                    error => console.log('Error on editting at server'));
        } else {
            this.databaseService.database.executeSql('CREATE TABLE IF NOT EXISTS editEmpTable (id PRIMARY KEY)', []).then(_ => {
                this.databaseService.database.executeSql(`
                    INSERT INTO editEmpTable (id) SELECT ${id}
                        WHERE NOT EXISTS (SELECT * FROM editEmpTable WHERE id = ${id})
                    `, []).then(data => { });
            });
        }
        return editEmp;
    }

    delEmployee(id: IEmployee['id']): Observable<void> {
        let delEmp: Observable<void>;
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            delEmp = this.http.delete<void>(`${this.ROOT_URL}/${id}?force=true`, { headers: this.headers });
        } else {
            delEmp = from(this.databaseService.database.executeSql('DELETE FROM employee WHERE id = ?', [id]).then(data => {
                this.databaseService.database.executeSql('DELETE FROM contactInfo WHERE empId = ?', [id]).then(_ => {
                    this.employeesFromDB().then(afterDel => {
                        this.dbEmployeeList = afterDel;
                    });
                });
            }));
        }
        return delEmp;
    }

    updateLocalDb(empArray: IEmployee[]) {
        console.log('update local db into');
        const emp = [];
        for (const em of empArray) {
            const emplo = this.selectedEmployee(em.id);
            emplo.subscribe(data => {
                emp.push(data);
                this.employeeArray = emp;
            },
                error => console.log('Error on uploading to Local DB: ', error)
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
                    return {
                        ...item,
                        department: item.department.id,
                        designation: item.designation.id,
                        employeeContactInfo: item.employeeContactInfo.id,
                        skills
                    };
                });

                const modifiedJson = {
                    structure: {
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
                console.log('ERROR');
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

    mergeServerDB() {
        forkJoin(
            this.employeesFromServer(),
            this.employeesFromDB()
        ).subscribe(data => {
            const empFromServer: any = data[0];
            const empFromDB: any = data[1];
            const addToDB = empFromServer.filter(server => !empFromDB.some(db => server.id === db.id));
            const addToServer = empFromDB.filter(db => !empFromServer.some(server => db.id === server.id));
            console.log('Employees missing From DB: ', addToDB);
            console.log('Employees missing From Server', addToServer);
            if (addToDB.length) {
                addToDB.forEach(emp => {
                    this.addEmpToDB(emp).subscribe(() => { });
                });
            }
            if (addToServer.length) {
                const empToAdd = addToServer.map(emp => {
                    console.log(emp, 'check here');
                    return {

                    };
                });
                // empToAdd.forEach(emp => {
                //     this.addEmpToServer(emp);
                // });
            }
        });

        this.getOfflineEdits().then(emps => {
            console.log('Editted Employees when Offline: ', emps);
            if (emps.length) {
                emps.forEach(emp => {
                    console.log(emp, 'emp');
                    this.http.put<void>(`${this.ROOT_URL}/${emp.id}`, emp, { headers: this.headers }).
                        subscribe(() => {
                            const id = JSON.stringify(emp.id);
                            this.databaseService.database.executeSql(`DELETE FROM editEmpTable WHERE id = ${id}`, []).then(_ => { });
                        },
                            error => console.log('Error on editting at server'));
                });
            } else {
                this.databaseService.database.executeSql('DROP TABLE IF EXISTS editEmpTable', []).then(_ => {
                    console.log('Employee Offline Edit Table Dropped');
                });
            }
        });
    }

    getOfflineEdits(): Promise<any[]> {
        const employees: any[] = [];
        this.databaseService.database.executeSql('CREATE TABLE IF NOT EXISTS editEmpTable (id PRIMARY KEY)', []).then(_ => {
            console.log('Dummy Employee Edit Table Created');
        });
        return this.databaseService.database.executeSql(`SELECT * FROM employee
            WHERE EXISTS (SELECT id FROM editEmpTable WHERE employee.id = editEmpTable.id)`, []).then(async data => {
            if (data.rows.length) {
                for (let i = 0; i < data.rows.length; i++) {
                    console.log(data.rows.item(i), 'edit emp');
                    const contactId = data.rows.item(i).employeeContactInfo;
                    this.getEmpContact(contactId).then(async contact => {
                        await employees.push({
                            id: data.rows.item(i).id,
                            firstName: data.rows.item(i).firstName,
                            lastName: data.rows.item(i).lastName,
                            fullName: data.rows.item(i).fullName,
                            displayName: data.rows.item(i).displayName,
                            startDate: data.rows.item(i).startDate,
                            resignationDate: data.rows.item(i).resignationDate,
                            resignationReason: data.rows.item(i).resignationReason,
                            email: data.rows.item(i).email,
                            contactInfo: contact[0],
                            departmentId: data.rows.item(i).department,
                            designationId: data.rows.item(i).designation,
                            skills: data.rows.item(i).skills,
                            projects: data.rows.item(i).currentProjects
                        });
                    });
                }
            }
            console.log(employees, 'check');
            return employees;
        });
    }
}
