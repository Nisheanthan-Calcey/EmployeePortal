import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from } from 'rxjs';

import { NetConnectionService } from './shared/connection.service';
import { ApiHeaderService } from './shared/apiHeader.service';
import { DepartmentService } from './department.service';

import { IDesignation } from 'src/components/designation/designation.interface';
import { DatabaseService } from './shared/database.service';

@Injectable()
export class DesignationService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Designations';
    private headers = this.headerService.header;
    private online: boolean;
    private dbDesignationList: IDesignation[];
    private apiDesignationList: IDesignation[];

    constructor(private http: HttpClient,
                private headerService: ApiHeaderService,
                private connectionService: NetConnectionService,
                private databaseService: DatabaseService,
                private sqlitePorter: SQLitePorter,
                private departmentService: DepartmentService
                ) {
                    this.connectionService.getConnectionState().subscribe(online => {
                        if (online) {
                            this.online = true;
                        } else {
                            this.online = false;
                        }
                    });
                }

    getDesignations(): IDesignation[] {
        if (this.online) {
            console.log('ONLINE');
            const designationsFromAPI = this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D` , { headers: this.headers});
            designationsFromAPI.subscribe(data => {Object.values(data)
                                    .map(values => this.apiDesignationList = values),
                                    console.log('Designations from API: ', this.apiDesignationList);
                                   // this.updateLocalDb(this.apiDesignationList);
                                },
                            error => {
                                console.log(error);
                                alert('Error on API, Trying to fetch Designations from Database');
                                this.designationsFromDB().subscribe(data => {
                                    this.apiDesignationList = data;
                                });
                            });
            return this.apiDesignationList;
        } else {
            console.log('OFFLINE');
            this.designationsFromDB().subscribe(data => {
                this.dbDesignationList = data;
            });
            return this.dbDesignationList;
        }
    }

    designationsFromDB(): Observable<IDesignation[]> {
        return new Observable(observer => {
            const designationsFromDB = this.databaseService.database.executeSql('SELECT * FROM designation', []);
            const designations: IDesignation[] = [];
            designationsFromDB.then(data => {
                if (data.rows.length > 0) {
                    for (let i = 0; i < data.rows.length; i++ ) {
                        const depId = data.rows.item(i).department;
                        this.departmentService.getDepartment(depId).then((dep) => {
                            designations.push({
                                id: data.rows.item(i).id,
                                name: data.rows.item(i).name,
                                department:  dep[0]
                            });
                            observer.next(designations);
                            observer.complete();
                        });
                    }
                    console.log('Designations from DB: ', designations);
                }
            });
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

    addNewDesignation(designation: any): Observable<IDesignation[]> {
        let addNewDes: Observable<IDesignation[]>;
        const desId = require('uuid/v4');
        const query = 'INSERT INTO designation (id, department, name) VALUES (?, ?, ?)';
        const newDes = [desId(), designation.departmentId, designation.name];
        addNewDes = from(this.databaseService.database.executeSql(query, newDes).then(data => {
                        if (data.rowsAffected === 1) {
                            this.designationsFromDB().subscribe(item => {
                                this.dbDesignationList = item;
                            });
                        }
                        return  this.dbDesignationList;
                    })
        );
        if (this.online) {
            this.http.post<IDesignation[]>(`${this.ROOT_URL}` , designation, { headers: this.headers}).
                subscribe(() => console.log('Added New Designation to server'),
                            error => console.log('Error on Adding to server'));
        }
        return addNewDes;
    }

    delDesignation(id: IDesignation['id']): Observable<void> {
        let delDes: Observable<void>;
        delDes = from(this.databaseService.database.executeSql('DELETE FROM designation WHERE id = ?', [id]).then(_ => {
                            this.designationsFromDB().subscribe(data => {
                                this.dbDesignationList = data;
                            });
                })
        );
        if (this.online) {
            this.http.delete<void>(`${this.ROOT_URL}/${id}?force=true`, { headers: this.headers}).
                subscribe(api => console.log('Deleted from server'),
                            error => console.log('Error on deleting from server'));
        }
        return delDes;
    }

    updateDesignation(designation: IDesignation): Observable<void> {
        let editDes: Observable<void>;
        const id = JSON.stringify(designation.id);
        const query = `UPDATE designation SET name = ? WHERE id = ${id}`;
        const changeDes = [designation.name];
        editDes = from(this.databaseService.database.executeSql(query, changeDes).then(data => {
                            if (data.rowsAffected === 1) {
                                this.designationsFromDB().subscribe(item => {
                                    this.dbDesignationList = item;
                                });
                            } else {
                                console.log('error on editing in db');
                            }
        }));
        if (this.online) {
            this.http.put<void>(`${this.ROOT_URL}/${designation.id}`, designation, {headers: this.headers}).
                subscribe(api => console.log('Editted in server'),
                            error => console.log('Error on editting in server'));
        }
        return editDes;
    }

    getDesignationsByDepartment(id: string): Observable<any> {
        return new Observable<any>(observer => {
            let designations: IDesignation[] = [];
            if (this.online) {
                // tslint:disable-next-line:max-line-length
                const des = this.http.get<any[]>(`http://animus.api.daily2/api/v1/Departments/${id}/Designations`, {headers: this.headers});
                des.subscribe(data => {Object.values(data)
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
                return {...item,
                    department: item.department.id
                };
            });
            const modifiedJson = {
                        structure : {
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

    updateServer() {
        if (this.online) {

            this.designationsFromDB().subscribe(item => {
                this.dbDesignationList = item;
            });

            this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D` , { headers: this.headers}).
                            subscribe(data => {Object.values(data)
                                                .map(values => this.apiDesignationList = values); },
                                    error => console.log('error on retrieving data')
                                     );

            if (this.dbDesignationList && this.apiDesignationList) {
                this.apiDesignationList.forEach(aDes => {
                    this.dbDesignationList.forEach(dDes => {
                        if (dDes.id === aDes.id && dDes.name === aDes.name) {
                            const index = this.dbDesignationList.indexOf(dDes, 0);
                            this.dbDesignationList.splice(index, 1);
                        }
                    });
                });
                const desToAdd = this.dbDesignationList.map((des: any) => {
                    return {
                        name: des.name,
                        id: des.id,
                        departmentId: des.department.id
                    };
                });
                desToAdd.forEach(des => {
                    this.http.post<IDesignation[]>(`${this.ROOT_URL}` , des, { headers: this.headers}).
                                        subscribe(data => {
                                                    this.getDesignations();
                                                    const id = Object.values(data)[0];
                                                    // editing back to db because adding to api will change the id of designation,
                                                    // so updating the new id is mandatory to stop redunduncy
                                                    const query = `UPDATE designation SET id = ? WHERE id = ${JSON.stringify(des.id)}`;
                                                    this.databaseService.database.executeSql(query, [id]).then(val => {
                                                        if (val.rowsAffected === 1) {
                                                            this.designationsFromDB().subscribe(item => {
                                                                this.dbDesignationList = item;
                                                            });
                                                        } else {
                                                            console.log('error on editing in db');
                                                        }
                                                    });
                                                },
                                                error => console.log('Error on Adding DB des to server'));
                });
                // need to check whether all dbdes id matches with apides ids, [done]
                // if yes check for individual field changes and update them
                // if no filter the unmatched id and add them to the server [done]
                // if apides has unmatched dbdes id, delete from server
                // all these things to be done according to the First come first serve manner (Time)
            }
        }
    }
}
