import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from, forkJoin } from 'rxjs';

import { DatabaseService } from './shared/database.service';
import { NetConnectionService, ConnectionStatus } from './shared/connection.service';
import { ApiHeaderService } from './shared/apiHeader.service';

import { IDepartment } from 'src/components/department/department.interface';

@Injectable()
export class DepartmentService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Departments';
    private headers = this.headerService.header;
    private dbDepartmentList: IDepartment[];
    private serverDepartmentList: IDepartment[];

    constructor(
        private http: HttpClient,
        private headerService: ApiHeaderService,
        private connectionService: NetConnectionService,
        private databaseService: DatabaseService,
        private sqlitePorter: SQLitePorter,
    ) { }

    departmentsFromServer(): Observable<IDepartment[]> {
        return new Observable<IDepartment[]>(observer => {
            let departments: IDepartment[];
            this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D`, { headers: this.headers }).subscribe(data => {
                Object.values(data)
                    .map(values => departments = values);
                console.log('Departments from Server: ', departments);
                observer.next(departments);
                observer.complete();
                // this.updateLocalDb(departments);
                // this.databaseService.database.executeSql('SELECT * FROM department', []).then(dbDep => {
                //     if (dbDep.rows.length < departments.length) {
                //         console.log(dbDep.rows, 'db dep');
                //         const addToDB = departments.filter(server => !dbDep.rows.some(db => server.id === db.id));
                //         console.log(addToDB, 'check');

                //         this.updateLocalDb(addToDB);
                //     }
                // }, error => {
                //     console.log('adding department to local db');
                //     this.updateLocalDb(departments);
                // });
            },
                error => {
                    alert('Error on API');
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

    searchDepartment(searchText: string): Observable<any[]> {
        return new Observable(observer => {
            let deps: any[] = [];
            if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
                console.log(this.serverDepartmentList, 'server department list');
                if (searchText.trim() !== '') {
                    this.departmentsFromServer().subscribe(data => {
                        deps = data.filter(val => {
                            return val.displayName.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
                        });
                        observer.next(deps);
                        observer.complete();
                    });
                } else {
                    observer.next(deps);
                    observer.complete();
                }
            } else {
                from(this.databaseService.database.executeSql(`SELECT * FROM department
                    WHERE displayName LIKE '%${searchText}%'`, []).then(data => {
                    if (data.rows.length) {
                        for (let i = 0; i < data.rows.length; i++) {
                            deps.push({
                                id: data.rows.item(i).id,
                                displayName: data.rows.item(i).displayName,
                                name: data.rows.item(i).name
                            });
                        }
                    }
                    observer.next(deps);
                    observer.complete();
                }));
            }
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

    addDepToServer(department) {
        this.http.post<IDepartment[]>(`${this.ROOT_URL}`, department, { headers: this.headers }).
            subscribe(d => {
                const newId = Object.values(d)[0];
                const query = `UPDATE department set id = ? WHERE id = ${JSON.stringify(department.id)}`;
                this.databaseService.database.executeSql(query, [newId]).then(val => {
                    if (val.rowsAffected === 1) {
                        this.departmentsFromDB().then(dept => {
                            this.dbDepartmentList = dept;
                        });
                    } else {
                        console.log('Error on Changing ID in DB');
                    }
                });
                this.departmentsFromServer().subscribe(dep => {
                    this.serverDepartmentList = dep;
                });
            },
                error => console.log('Error on Adding DB dep to server'));
    }

    addDepToDB(department: IDepartment): Observable<IDepartment[]> {
        let addNewDep: Observable<IDepartment[]>;
        const query = 'INSERT INTO department (id, name, displayName) VALUES (?, ?, ?)';
        const newDep = [department.id, department.name, department.displayName];
        addNewDep = from(this.databaseService.database.executeSql(query, newDep).then(data => {
            this.departmentsFromDB().then(depAfterAdd => {
                this.dbDepartmentList = depAfterAdd;
            });
            return this.dbDepartmentList;
        }));
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.addDepToServer(department);
        }
        return addNewDep;
    }

    delDepartment(id: IDepartment['id']): Observable<void> {
        let delDep: Observable<void>;
        delDep = from(this.databaseService.database.executeSql('DELETE FROM department WHERE id = ?', [id]).then(_ => {
            this.departmentsFromDB().then(dep => {
                this.dbDepartmentList = dep;
            });
        }));
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.http.delete<void>(`${this.ROOT_URL}/${id}?force=true`, { headers: this.headers }).
                subscribe(server => {
                    console.log('Deleted from server', server);
                    this.departmentsFromServer().subscribe(data => {
                        this.serverDepartmentList = data;
                    });
                },
                    error => console.log('Error on deleting from server'));
        }
        return delDep;
    }

    updateDepartment(department: IDepartment): Observable<void> {
        let editDep: Observable<void>;
        const id = JSON.stringify(department.id);
        const query = `UPDATE department SET name = ? WHERE id = ${id}`;
        editDep = from(this.databaseService.database.executeSql(query, [department.name]).then(data => {
            if (data.rowsAffected === 1) {
                this.departmentsFromDB().then(depAfterEdit => {
                    this.dbDepartmentList = depAfterEdit;
                });
            } else {
                console.log('Editing Department at DB failed');
            }
        }));
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.http.put<void>(`${this.ROOT_URL}/${department.id}`, department, { headers: this.headers }).
                subscribe(() => console.log('Edited Department at Server'),
                    error => console.log('Editing Department at Server failed')
                );
        } else {
            this.databaseService.database.executeSql('CREATE TABLE IF NOT EXISTS editDepTable (id PRIMARY KEY)', []).then(_ => {
                this.databaseService.database.executeSql(`
                    INSERT INTO editDepTable (id) SELECT ${id}
                        WHERE NOT EXISTS (SELECT * FROM editDepTable WHERE id = ${id})
                `, []).then(data => { });
            });
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
            this.departmentsFromServer()
        ).subscribe(data => {
            const depFromDB = data[0];
            const depFromServer = data[1];
            const addToDB = depFromServer.filter(server => !depFromDB.some(db => server.id === db.id));
            const addToServer = depFromDB.filter(db => !depFromServer.some(server => db.id === server.id));
            console.log('Departments missing From DB: ', addToDB);
            console.log('Departments missig From Server', addToServer);
            if (addToDB.length) {
                addToDB.forEach(dep => {
                    this.addDepToDB(dep).subscribe(() => {
                    });
                });
            }
            if (addToServer.length) {
                addToServer.forEach(dep => {
                    this.addDepToServer(dep);
                });
            }
        });

        this.getOfflineEdits().then(departments => {
            console.log('Edited Dep when offline: ', departments);
            if (departments.length) {
                departments.forEach(dep => {
                    this.http.put<void>(`${this.ROOT_URL}/${dep.id}`, dep, { headers: this.headers }).
                        subscribe(() => {
                            const id = JSON.stringify(dep.id);
                            this.databaseService.database.executeSql(`DELETE FROM editDepTable WHERE id = ${id}`, []).then(_ => { });
                        },
                            error => console.log('Editing Offline Dep at Server failed')
                        );
                });
            } else {
                this.databaseService.database.executeSql('DROP TABLE IF EXISTS editDepTable', []).then(_ => {
                    console.log('Department Offline Edit Table Dropped');
                });
            }
        });
    }

    getOfflineEdits(): Promise<IDepartment[]> {
        const deps: IDepartment[] = [];
        this.databaseService.database.executeSql('CREATE TABLE IF NOT EXISTS editDepTable (id PRIMARY KEY)', []).then(data => {
            console.log('Dummy Department Edit Table Created');
        });
        return this.databaseService.database.executeSql(`SELECT * FROM department
            WHERE EXISTS (SELECT id FROM editDepTable WHERE department.id = editDepTable.id)`, []).then(data => {
            if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                    deps.push({
                        id: data.rows.item(i).id,
                        name: data.rows.item(i).name,
                        displayName: data.rows.item(i).displayName
                    });
                }
            }
            return deps;
        });
    }

}
