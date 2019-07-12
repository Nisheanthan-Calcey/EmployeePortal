import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from, forkJoin } from 'rxjs';

import { DatabaseService } from './shared/database.service';
import { ApiHeaderService } from './shared/apiHeader.service';
import { NetConnectionService, ConnectionStatus } from './shared/connection.service';
import { DepartmentService } from './department.service';

import { ISkills } from 'src/components/skill/skill.interface';
import { IDepartment } from 'src/components/department/department.interface';

@Injectable()
export class SkillService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Skills';
    private headers = this.headerService.header;
    private dbSkillList: ISkills[];
    private serverSkillList: ISkills[];

    constructor(
        private http: HttpClient,
        private headerService: ApiHeaderService,
        private connectionService: NetConnectionService,
        private databaseService: DatabaseService,
        private departmentService: DepartmentService,
        private sqlitePorter: SQLitePorter) { }

    skillsFromServer(): Observable<ISkills[]> {
        return new Observable(observer => {
            let skills: ISkills[];
            this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D`, { headers: this.headers }).subscribe(data => {
                Object.values(data)
                    .map(list => skills = list);
                console.log('Skills from Server: ', skills);
                this.updateToLocalDB(skills);
                observer.next(skills);
                observer.complete();
            },
                error => {
                    alert('Error on API');
                    observer.error(error);
                });
        });
    }

    skillsFromDB(): Promise<any[]> {
        const skills: any[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM skill', []).then(async data => {
            if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                    const depId = data.rows.item(i).department;
                    await this.departmentService.getDepartment(depId).then((dep) => {
                        skills.push({
                            id: data.rows.item(i).id,
                            name: data.rows.item(i).name,
                            department: dep[0],
                        });
                    });
                }
                console.log('Skills from DB: ', skills);
            }
            return skills;
        });
    }

    searchSkills(searchText: string): Observable<any[]> {
        return new Observable(observer => {
            let skills: any[] = [];
            if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
                this.skillsFromServer().subscribe(data => {
                    skills = data.filter(val => {
                        return val.name.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
                    });
                    observer.next(skills);
                    observer.complete();
                });
            } else {
                from(this.databaseService.database.executeSql(`SELECT id,name FROM skill
                    WHERE name LIKE '%${searchText}%'`, []).then(data => {
                    if (data.rows.length) {
                        for (let i = 0; i < data.rows.length; i++) {
                            skills.push({
                                id: data.rows.item(i).id,
                                name: data.rows.item(i).name
                            });
                        }
                    }
                    observer.next(skills);
                    observer.complete();
                }));
            }
        });
    }

    getSkill(id: ISkills['skillId']): Promise<ISkills[]> {
        const skill: ISkills[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM skill WHERE id = ?', [id]).then(data => {
            if (data.rows.length > 0) {
                skill.push({
                    skillId: data.rows.item(0).id,
                    name: data.rows.item(0).name,
                    department: data.rows.item(0).department
                });
            }
            return skill;
        });
    }

    addSkillToServer(skill) {
        this.http.post<ISkills[]>(`${this.ROOT_URL}`, skill, { headers: this.headers }).
            subscribe(s => {
                const newId = Object.values(s)[0];
                const query = `UPDATE skill SET id = ? WHERE id = ${JSON.stringify(skill.id)}`;
                this.databaseService.database.executeSql(query, [newId]).then(val => {
                    if (val.rowsAffected === 1) {
                        this.skillsFromDB().then(skills => {
                            this.dbSkillList = skills;
                        });
                    } else {
                        console.log('error on editing in db');
                    }
                });
                this.skillsFromServer().subscribe(skills => {
                    this.serverSkillList = skills;
                });
            },
                error => console.log('Error on Adding DB Skill to Server'));
    }

    addSkillToDB(skill: any): Observable<ISkills[]> {
        let addNewSkill: Observable<ISkills[]>;
        const query = 'INSERT INTO skill (id,name,department) VALUES (?,?,?)';
        const newSkill = [skill.id, skill.name, skill.departmentId];
        addNewSkill = from(this.databaseService.database.executeSql(query, newSkill).then(data => {
            this.skillsFromDB().then(afterAdd => {
                this.dbSkillList = afterAdd;
            });
            return this.dbSkillList;
        }));
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.addSkillToServer(skill);
        }
        return addNewSkill;
    }

    updateSkill(skill: any): Observable<void> {
        let editSkill: Observable<void>;
        const id = JSON.stringify(skill.id);
        const query = `UPDATE skill SET name = ? WHERE id = ${id}`;
        const changeSkill = [skill.name];
        editSkill = from(this.databaseService.database.executeSql(query, changeSkill).then(data => {
            if (data.rowsAffected === 1) {
                this.skillsFromDB().then(afterEdit => {
                    this.dbSkillList = afterEdit;
                });
            } else {
                console.log('Editing Skill at DB failed');
            }
        }));
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.http.put<void>(`${this.ROOT_URL}/${skill.id}`, skill, { headers: this.headers }).
                subscribe(server => console.log('Editted in server'),
                    error => console.log('Error on editting at server'));
        } else {
            this.databaseService.database.executeSql('CREATE TABLE IF NOT EXISTS editSkillTable (id PRIMARY KEY)', []).then(_ => {
                this.databaseService.database.executeSql(`
                    INSERT INTO editSkillTable (id) SELECT ${id}
                        WHERE NOT EXISTS (SELECT * FROM editSkillTable WHERE id = ${id})
                `, []).then(data => { });
            });
        }
        return editSkill;
    }

    delSkill(id: ISkills['skillId']): Observable<void> {
        let delSkill: Observable<void>;
        delSkill = from(this.databaseService.database.executeSql('DELETE FROM skill WHERE id = ?', [id]).then(_ => {
            this.skillsFromDB().then(afterDel => {
                this.dbSkillList = afterDel;
            });
        }));
        if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
            this.http.delete<void>(`${this.ROOT_URL}/${id}?force=true`, { headers: this.headers }).
                subscribe(server => console.log('Skill Deleted from server'),
                    error => console.log('Error on deleting from server'));
        }
        return delSkill;
    }

    getSkillsByDepartment(id: IDepartment['id']): Observable<any> {
        return new Observable<any>(observer => {
            let skills: ISkills[] = [];
            if (this.connectionService.getCurrentNetworkStatus() === ConnectionStatus.Online) {
                // tslint:disable-next-line:max-line-length
                const skill = this.http.get<any[]>(`http://animus.api.daily2/api/v1/Departments/${id}/Skills`, { headers: this.headers });
                skill.subscribe(data => {
                    Object.values(data)
                        .map(list => skills = list),
                        observer.next(skills);
                    observer.complete();
                },
                    error => (console.log(error)));
            } else {
                from(this.databaseService.database.executeSql('SELECT * FROM skill WHERE department = ?', [id]).then(skill => {
                    if (skill.rows.length > 0) {
                        for (let s = 0; s < skill.rows.length; s++) {
                            skills.push({
                                skillId: skill.rows.item(s).id,
                                name: skill.rows.item(s).name,
                                department: skill.rows.item(s).department,
                            });
                        }
                    }
                    observer.next(skills);
                    observer.complete();
                })
                );
            }
        });
    }

    updateToLocalDB(skillsArray: any[]) {
        if (skillsArray) {
            const newSkillsArray = skillsArray.map(item => {
                return {
                    ...item,
                    department: item.department.id
                };
            });
            const modifiedJson = {
                structure: {
                    tables: {
                        skill: '([id] PRIMARY KEY, [name], [department])',
                    }
                },
                data: {
                    inserts: {
                        skill: newSkillsArray
                    }
                }
            };
            this.sqlitePorter.importJsonToDb(this.databaseService.database, modifiedJson);
        }
    }

    mergeServerDB() {
        forkJoin(
            this.skillsFromServer(),
            this.skillsFromDB()
        ).subscribe(data => {
            const skillFromServer: any[] = data[0];
            const skillFromDB = data[1];
            const addToDB = skillFromServer.filter(server => !skillFromDB.some(db => server.id === db.id));
            const addToServer = skillFromDB.filter(db => !skillFromServer.some(server => db.id === server.id));
            console.log('Skills missing From DB: ', addToDB);
            console.log('Skills missing From Server', addToServer);
            if (addToDB.length) {
                const skillToAdd = addToDB.map((skill: any) => {
                    return {
                        id: skill.id,
                        name: skill.name,
                        departmentId: skill.department.id
                    };
                });
                skillToAdd.forEach(skill => {
                    this.addSkillToDB(skill).subscribe(() => { });
                });
            }
            if (addToServer.length) {
                const skillToAdd = addToServer.map((skill: any) => {
                    return {
                        name: skill.name,
                        departmentId: skill.department.id
                    };
                });
                skillToAdd.forEach(skill => {
                    this.addSkillToServer(skill);
                });
            }
        });

        this.getOfflineEdits().then(skills => {
            console.log('Editted Skills when offline: ', skills);
            if (skills.length) {
                skills.forEach(skill => {
                    this.http.put<void>(`${this.ROOT_URL}/${skill.id}`, skill, { headers: this.headers }).
                        subscribe(() => {
                            const id = JSON.stringify(skill.id);
                            this.databaseService.database.executeSql(`DELETE FROM editSkillTable WHERE id = ${id}`, []).then(_ => { });
                        },
                            error => console.log('Error on editting at server'));
                });
            } else {
                this.databaseService.database.executeSql('DROP TABLE IF EXISTS editSkillTable', []).then(_ => {
                    console.log('Skill Offline Edit Table Dropped');
                });
            }
        });
    }

    getOfflineEdits(): Promise<any[]> {
        const skills: any[] = [];
        this.databaseService.database.executeSql('CREATE TABLE IF NOT EXISTS editSkillTable (id PRIMARY KEY)', []).then(_ => {
            console.log('Dummy Skill Edit Table Created');
        });
        return this.databaseService.database.executeSql(`SELECT * FROM skill
            WHERE EXISTS (SELECT id FROM editSkillTable WHERE skill.id = editSkillTable.id)`, []).then(async data => {
            if (data.rows.length) {
                console.log(data.rows);
                for (let i = 0; i < data.rows.length; i++) {
                    const depId = data.rows.item(i).department;
                    await this.departmentService.getDepartment(depId).then((dep) => {
                        skills.push({
                            id: data.rows.item(i).id,
                            name: data.rows.item(i).name,
                            department: dep[0],
                        });
                    });
                }
            }
            return skills;
        });
    }
}
