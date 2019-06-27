import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from } from 'rxjs';

import { NetConnectionService } from './shared/connection.service';
import { ApiHeaderService } from './shared/apiHeader.service';

import { IDepartment } from 'src/components/department/department.interface';
import { DatabaseService } from './shared/database.service';

@Injectable()
export class DepartmentService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Departments';
    private headers = this.headerService.header;
    private online: boolean;
    private departmentList: IDepartment[];
    private depList;

    constructor(private http: HttpClient,
                private headerService: ApiHeaderService,
                private connectionService: NetConnectionService,
                private databaseService: DatabaseService,
                private sqlitePorter: SQLitePorter,
                ) {
                    this.connectionService.getConnectionState().subscribe(online => {
                        if (online) {
                            this.online = true;
                        } else {
                            this.online = false;
                        }
                     });
                }

    getDepartments(): IDepartment[] {
        if (this.online) {
            console.log('ONLINE');
            const departmentFromAPI = this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D`, {  headers: this.headers});
            departmentFromAPI.subscribe(data => {Object.values(data)
                                .map(values => this.departmentList = values),
                                console.log('Departments from API: ', this.departmentList);
                                                 this.updateLocalDb(this.departmentList);
                            },
                            error => {
                                console.log(error);
                                alert('Error on API, Trying to fetch Departments from Database');
                                this.departmentList = this.departmentsFromDB();
                            });
        } else {
            console.log('OFFLINE');
            this.departmentList = this.departmentsFromDB();
        }
        return this.departmentList;
    }

    departmentsFromDB(): IDepartment[] {
        const departmentFromDB = this.databaseService.database.executeSql('SELECT * FROM department', []);
        const departments: IDepartment[] = [];
        departmentFromDB.then(data => {
            if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                departments.push({
                        id: data.rows.item(i).id,
                        name: data.rows.item(i).name,
                        displayName: data.rows.item(i).displayName
                    });
                }
                console.log('Departments from DB: ', this.departmentList);
            }
        });
        return departments;
    }

    getDepartment(id: any): Promise<IDepartment[]> {
        const department: IDepartment[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM department WHERE id = ?', [id]).then(data => {
            if (data.rows.length > 0) {
                department.push({
                    id: data.rows.item(0).id,
                    name: data.rows.item(0).name,
                    displayName: data.rows.item(0).displayName
                });
            }
            return department;
        });
    }

    addNewDepartment(department: IDepartment): Observable<IDepartment[]> {
        let addNewDep: Observable<IDepartment[]> ;
        const depId = require('uuid/v4');
        const query = 'INSERT INTO department (id, name, displayName) VALUES (?, ?, ?)';
        const newDep = [depId(), department.name, department.displayName];
        addNewDep = from(this.databaseService.database.executeSql(query, newDep).then(data => {
                            this.departmentList = this.departmentsFromDB();
                            return this.departmentList;
                    })
            );
        if (this.online) {
            this.http.post<IDepartment[]>(`${this.ROOT_URL}` , department, { headers: this.headers})
                .subscribe(api => console.log('newly added department to SERVER', api),
                            error => console.log('Error on adding department to Server')
                            );
        }
        return addNewDep;
    }

    updateDepartment(department: IDepartment): Observable<void> {
        let editDep: Observable<void> ;
        const id = JSON.stringify(department.id);
        const query = `UPDATE department SET name = ? WHERE id = ${id}`;
        const newDep = [department.name];
        editDep = from(this.databaseService.database.executeSql(query, newDep).then(data => {
                        if (data.rowsAffected === 1) {
                            this.departmentList = this.departmentsFromDB();
                        } else {
                            console.log('Editing at DB failed');
                        }
        }));
        if (this.online) {
            this.http.put<void>(`${this.ROOT_URL}/${department.id}`, department, { headers: this.headers}).
                subscribe(() => console.log('Edited at API'),
                            error => console.log('Editing at API failed')
                );
        }
        return editDep;
    }

    updateLocalDb(depArray: IDepartment[]) {
        if (depArray) {
            const modifiedJson = {
                structure : {
                    tables: {
                        department: '([id] PRIMARY KEY, [name], [displayName])',
                    },
                    otherSQL: [
                        'CREATE UNIQUE INDEX id ON department(id)'
                    ]
                },
                data: {
                    inserts: {
                        department: depArray
                    }
                }
            };
            this.sqlitePorter.importJsonToDb(this.databaseService.database, modifiedJson);
        }
    }

    updateServer() {
        if (this.online) {
            this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D`, {  headers: this.headers})
                                .subscribe(data => {Object.values(data)
                                                        .map(values => this.depList = values );
                                                    console.log(this.depList, 'API 2');
                                                    },
                                            error =>  console.log('error: ', error) );
            const dbDep = this.departmentsFromDB();
            console.log(this.depList, 'API');
            console.log(dbDep, 'DB');
            // const addDep = this.http.post<IDepartment[]>(`${this.ROOT_URL}` , department, { headers: this.headers});
        }
    }
}
