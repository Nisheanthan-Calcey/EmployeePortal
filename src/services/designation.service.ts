import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from, forkJoin } from 'rxjs';

import { DatabaseService } from './shared/database.service';
import { NetConnectionService, ConnectionStatus } from './shared/connection.service';
import { ApiHeaderService } from './shared/apiHeader.service';
import { DepartmentService } from './department.service';

import { IDesignation } from 'src/components/designation/designation.interface';

@Injectable()
export class DesignationService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Designations';
    private headers = this.headerService.header;
    private dbDesignationList: IDesignation[];
    private serverDesignationList: IDesignation[];

    constructor(
        private http: HttpClient,
        private headerService: ApiHeaderService,
        private connectionService: NetConnectionService,
        private databaseService: DatabaseService,
        private sqlitePorter: SQLitePorter,
        private departmentService: DepartmentService
    ) { }

    designationsFromServer(): Observable<IDesignation[]> {
        return new Observable<IDesignation[]>(observer => {
            let designations: IDesignation[];
            this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D`, { headers: this.headers }).subscribe(data => {
                Object.values(data)
                    .map(values => designations = values);
                console.log('Designations from Server: ', designations);
                this.updateLocalDb(designations);
                observer.next(designations);
                observer.complete();
                // this.databaseService.database.executeSql('SELECT * FROM designation', []).then(dbDes => {
                //     if (dbDes.rows.length < designations.length) {
                //         console.log(dbDes, 'db des');
                //         const addToDB = designations.filter(server => !dbDes.some(db => server.id === db.id));
                //         console.log('adding designations to local db', addToDB);
                //         this.updateLocalDb(addToDB);
                //     }
                // }, error => {
                //     console.log('adding designations to local db');
                //     this.updateLocalDb(designations);
                // });
            },
                error => {
                    alert('Error on API');
                    observer.error(error);
                }
            );
        });
    }

    designationsFromDB(): Promise<IDesignation[]> {
        const designations: IDesignation[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM designation', []).then(async data => {
            if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                    const depId = data.rows.item(i).department;
                    await this.departmentService.getDepartment(depId).then(dep => {
                        designations.push({
                            id: data.rows.item(i).id,
                            name: data.rows.item(i).name,
                            department: dep[0]
                        });
                    });
                }
                console.log('Designations from DB: ', designations);
                return designations;
            }
        });
    }

    getDesignation(id: any): Promise<IDesignation[]> {
        const designation: IDesignation[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM designation WHERE id =?', [id]).then(data => {
            if (data.rows.length > 0) {
                designation.push({
                    id: data.rows.item(0).id,
                    name: data.rows.item(0).name,
                    department: data.rows.item(0).department
                });
            }
            return designation;
        });
    }

    addDesToServer(designation) {
        this.http.post<IDesignation[]>(`${this.ROOT_URL}`, designation, { headers: this.headers }).
            subscribe(d => {
                const newId = Object.values(d)[0];
                const query = `UPDATE designation SET id = ? WHERE id = ${JSON.stringify(designation.id)}`;
                this.databaseService.database.executeSql(query, [newId]).then(val => {
                    if (val.rowsAffected === 1) {
                        this.designationsFromDB().then(desig => {
                            this.dbDesignationList = desig;
                        });
                    } else {
                        console.log('error on editing in db');
                    }
                });
                this.designationsFromServer().subscribe(des => {
                    this.serverDesignationList = des;
                });
            },
                error => console.log('Error on Adding DB Designation to server'));
    }

    addDesToDB(designation: any): Observable<IDesignation[]> {
        let addNewDes: Observable<IDesignation[]>;
        const query = 'INSERT INTO designation (id, department, name) VALUES (?, ?, ?)';
        const newDes = [designation.id, designation.departmentId, designation.name];
        addNewDes = from(this.databaseService.database.executeSql(query, newDes).then(data => {
            if (data.rowsAffected === 1) {
                this.designationsFromDB().then(des => {
                    this.dbDesignationList = des;
                });
            }
            return this.dbDesignationList;
        }));
        return addNewDes;
    }

    delDesignation(id: IDesignation['id']): Observable<void> {
        let delDes: Observable<void>;
        delDes = from(this.databaseService.database.executeSql('DELETE FROM designation WHERE id = ?', [id]).then(_ => {
            this.designationsFromDB().then(des => {
                this.dbDesignationList = des;
            });
        })
        );
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.http.delete<void>(`${this.ROOT_URL}/${id}?force=true`, { headers: this.headers }).
                subscribe(server => console.log('Deleted from server'),
                    error => console.log('Error on deleting from server'));
        }
        return delDes;
    }

    updateDesignation(designation: IDesignation): Observable<void> {
        let editDes: Observable<void>;
        const id = JSON.stringify(designation.id);
        const query = `UPDATE designation SET name = ? WHERE id = ${id}`;
        editDes = from(this.databaseService.database.executeSql(query, [designation.name]).then(data => {
            if (data.rowsAffected === 1) {
                this.designationsFromDB().then(des => {
                    this.dbDesignationList = des;
                });
            } else {
                console.log('Editing Designation at DB failed');
            }
        }));
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.http.put<void>(`${this.ROOT_URL}/${designation.id}`, designation, { headers: this.headers }).
                subscribe(server => console.log('Edited Designation at Server'),
                    error => console.log('Editing Designation at Server failed'));
        } else {
            this.databaseService.database.executeSql('CREATE TABLE IF NOT EXISTS editDesTable (id PRIMARY KEY)', []).then(_ => {
                this.databaseService.database.executeSql(`
                    INSERT INTO editDesTable (id) SELECT ${id}
                        WHERE NOT EXISTS (SELECT * FROM editDesTable WHERE id = ${id})
                `, []).then(data => { });
            });
        }
        return editDes;
    }

    getDesignationsByDepartment(id: string): Observable<any> {
        return new Observable<any>(observer => {
            let designations: IDesignation[] = [];
            if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
                // tslint:disable-next-line:max-line-length
                const des = this.http.get<any[]>(`http://animus.api.daily2/api/v1/Departments/${id}/Designations`, { headers: this.headers });
                des.subscribe(data => {
                    Object.values(data)
                        .map(values => designations = values),
                        observer.next(designations);
                    observer.complete();
                },
                    error => {
                        console.log(error);
                    });
            } else {
                this.databaseService.database.executeSql('SELECT * FROM designation WHERE department = ?', [id]).then(des => {
                    if (des.rows.length > 0) {
                        for (let d = 0; d < des.rows.length; d++) {
                            designations.push({
                                id: des.rows.item(d).id,
                                name: des.rows.item(d).name,
                                department: des.rows.item(d).department
                            });
                        }
                    }
                    observer.next(designations);
                    observer.complete();
                });
            }
        });
    }

    updateLocalDb(desArray: IDesignation[]) {
        if (desArray) {
            const newDesArray = desArray.map(item => {
                return {
                    ...item,
                    department: item.department.id
                };
            });
            const modifiedJson = {
                structure: {
                    tables: {
                        designation: '([id] PRIMARY KEY, [name], [department])',
                    },
                    otherSQL: [
                        'CREATE UNIQUE INDEX DESID ON designation(id)'
                    ]
                },
                data: {
                    inserts: {
                        designation: newDesArray
                    }
                }
            };
            this.sqlitePorter.importJsonToDb(this.databaseService.database, modifiedJson);
        }
    }

    mergeServerDB() {
        forkJoin(
            this.designationsFromServer(),
            this.designationsFromDB()
        ).subscribe(data => {
            const desFromServer = data[0];
            const desFromDB = data[1];
            const addToDB = desFromServer.filter(server => !desFromDB.some(db => server.id === db.id));
            const addToServer = desFromDB.filter(db => !desFromServer.some(server => db.id === server.id));
            console.log('Designations missing From DB: ', addToDB);
            console.log('Designations missing From Server', addToServer);
            if (addToDB.length) {
                addToDB.forEach(des => {
                    this.addDesToDB(des).subscribe(() => { });
                });
            }
            if (addToServer.length) {
                const desToAdd = addToServer.map((des: any) => {
                    return {
                        name: des.name,
                        id: des.id,
                        departmentId: des.department.id
                    };
                });
                desToAdd.forEach(des => {
                    this.addDesToServer(des);
                });
            }
        });

        this.getOfflineEdits().then(designations => {
            console.log('Edited Des when offline: ', designations);
            if (designations.length) {
                designations.forEach(des => {
                    this.http.put<void>(`${this.ROOT_URL}/${des.id}`, des, { headers: this.headers }).
                        subscribe(() => {
                            const id = JSON.stringify(des.id);
                            this.databaseService.database.executeSql(`DELETE FROM editDesTable WHERE id = ${id}`, []).then(_ => { });
                        },
                            error => console.log('Editing Offline Des at Server failed')
                        );
                });
            } else {
                this.databaseService.database.executeSql('DROP TABLE IF EXISTS editDesTable', []).then(_ => {
                    console.log('Department Offline Edit Table Dropped');
                });
            }
        });
    }

    getOfflineEdits(): Promise<IDesignation[]> {
        const dess: IDesignation[] = [];
        this.databaseService.database.executeSql('CREATE TABLE IF NOT EXISTS editDesTable (id PRIMARY KEY)', []).then(data => {
            console.log('Dummy Designation Edit Table Created');
        });
        return this.databaseService.database.executeSql(`SELECT * FROM designation
            WHERE EXISTS (SELECT id FROM editDesTable WHERE designation.id = editDesTable.id)`, []).then(async data => {
            if (data.rows.length) {
                for (let i = 0; i < data.rows.length; i++) {
                    const depId = data.rows.item(i).department;
                    await this.departmentService.getDepartment(depId).then(dep => {
                        dess.push({
                            id: data.rows.item(i).id,
                            name: data.rows.item(i).name,
                            department: dep[0]
                        });
                    });
                }
            }
            return dess;
        });
    }
}
