import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from, forkJoin } from 'rxjs';
import * as _ from 'lodash';

import { NetConnectionService } from './shared/connection.service';
import { ApiHeaderService } from './shared/apiHeader.service';

import { IDepartment } from 'src/components/department/department.interface';
import { DatabaseService } from './shared/database.service';

@Injectable()
export class DepartmentService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Departments';
    private headers = this.headerService.header;
    private online: boolean;
    private dbDepartmentList: IDepartment[];
    private apiDepartmentList: IDepartment[];

    constructor(
        private http: HttpClient,
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

    departmentsFromAPI(): Observable<IDepartment[]> {
        return new Observable<IDepartment[]>(observer => {
            let departments: IDepartment[];
            this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D`, { headers: this.headers }).subscribe(data => {
                Object.values(data)
                    .map(values => departments = values);
                console.log('Departments from API: ', departments);
                observer.next(departments);
                observer.complete();
                // this.databaseService.database.executeSql('SELECT * FROM department', []).then(dbDep => {
                //     if (dbDep.rows.length < departments.length) {
                //         console.log(dbDep.rows, 'db dep');
                //         const addToDB = departments.filter(api => !dbDep.rows.some(db => api.id === db.id));
                //         console.log(addToDB, 'check');

                //         this.updateLocalDb(addToDB);
                //     }
                // }, error => {
                //     console.log('adding department to local db');
                //     this.updateLocalDb(departments);
                // });
            },
                error => {
                    alert('Error on API, Trying to fetch Departments from Database');
                    observer.error(error);
                }
            );
        });
    }

    departmentsFromDB(): Promise<IDepartment[]> {
        const departments: IDepartment[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM department', []).then(data => {
            if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                    departments.push({
                        id: data.rows.item(i).id,
                        name: data.rows.item(i).name,
                        displayName: data.rows.item(i).displayName
                    });
                }
                console.log('Departments from DB: ', departments);
            }
            return departments;
        });
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
        let addNewDep: Observable<IDepartment[]>;
        const depId = require('uuid/v4');
        const query = 'INSERT INTO department (id, name, displayName) VALUES (?, ?, ?)';
        const newDep = [depId(), department.name, department.displayName];
        addNewDep = from(this.databaseService.database.executeSql(query, newDep).then(data => {
            this.departmentsFromDB().then(depAfterAdd => {
                this.dbDepartmentList = depAfterAdd;
            });
            return this.dbDepartmentList;
        })
        );
        if (this.online) {
            this.http.post<IDepartment[]>(`${this.ROOT_URL}`, department, { headers: this.headers })
                .subscribe(api => console.log('newly added department to SERVER', api),
                    error => console.log('Error on adding department to Server')
                );
        }
        return addNewDep;
    }

    updateDepartment(department: IDepartment): Observable<void> {
        let editDep: Observable<void>;
        const id = JSON.stringify(department.id);
        const query = `UPDATE department SET name = ? WHERE id = ${id}`;
        const newDep = [department.name];
        editDep = from(this.databaseService.database.executeSql(query, newDep).then(data => {
            if (data.rowsAffected === 1) {
                this.departmentsFromDB().then(depAfterEdit => {
                    this.dbDepartmentList = depAfterEdit;
                });
            } else {
                console.log('Editing at DB failed');
            }
        }));
        if (this.online) {
            this.http.put<void>(`${this.ROOT_URL}/${department.id}`, department, { headers: this.headers }).
                subscribe(() => console.log('Edited at API'),
                    error => console.log('Editing at API failed')
                );
        }
        return editDep;
    }

    updateLocalDb(depArray: IDepartment[]) {
        if (depArray) {
            const modifiedJson = {
                structure: {
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

    mergeServerDB() {
        forkJoin(
            this.departmentsFromDB(),
            this.departmentsFromAPI()
        ).subscribe(data => {
            const depFromDB = data[0];
            const depFromAPI = data[1];
            const addToDB = depFromAPI.filter(api => !depFromDB.some(db => api.id === db.id));
            const addToServer = depFromDB.filter(db => !depFromAPI.some(api => db.id === api.id));
            console.log(addToDB, 'add to db');
            console.log(addToServer, 'add to server');
            if (addToDB.length) {
                this.addToDB(addToDB);
            }
            if (addToServer.length) {
                this.addToServer(addToServer);
            }
        });
    }

    addToServer(departments) {
        departments.forEach(dep => {
            // adding to server will be done here
        });
    }

    addToDB(departments) {
        departments.forEach(dep => {
            // adding to db will be done here
        });
    }
}
