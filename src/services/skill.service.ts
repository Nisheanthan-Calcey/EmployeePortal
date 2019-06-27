import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { Observable, from } from 'rxjs';

import { ApiHeaderService } from './shared/apiHeader.service';
import { NetConnectionService } from './shared/connection.service';
import { DepartmentService } from './department.service';

import { ISkills } from 'src/components/skill/skill.interface';
import { IDepartment } from 'src/components/department/department.interface';
import { DatabaseService } from './shared/database.service';

@Injectable()
export class SkillService {
    readonly ROOT_URL = 'http://animus.api.daily2/api/v1/Skills';
    private headers = this.headerService.header;
    private skillList: ISkills[];
    private online: boolean;

    constructor(private http: HttpClient,
                private headerService: ApiHeaderService,
                private connectionService: NetConnectionService,
                private databaseService: DatabaseService,
                private departmentService: DepartmentService,
                private sqlitePorter: SQLitePorter) {
                    this.connectionService.getConnectionState().subscribe(online => {
                        if (online) {
                            this.online = true;
                        } else {
                            this.online = false;
                        }
                    });

                    }

    getSkills(): ISkills[] {
        if (this.online) {
            console.log('ONLINE');
            const skillsFromAPI = this.http.get<any[]>(`${this.ROOT_URL}?query=%7B%7D` , { headers: this.headers });
            skillsFromAPI.subscribe(data => (Object.values(data)
                                        .map(list => this.skillList = list),
                                        console.log('Skills from API: ', this.skillList),
                                        this.updateToLocalDB(this.skillList)),
                                    error => {
                                            console.log(error);
                                            alert('Error on API, Trying to fetch Skills from Database');
                                            this.skillList = this.skillsFromDB();
                                    });
        } else {
            console.log('OFFLINE');
            this.skillList = this.skillsFromDB();
        }
        return this.skillList;
    }

    skillsFromDB(): any[] {
        const skillsFromDB = this.databaseService.database.executeSql('SELECT * FROM skill', []);
        const skills: any[] = [];
        skillsFromDB.then(data => {
            if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                    const depId = data.rows.item(i).department;
                    this.departmentService.getDepartment(depId).then((dep) => {
                        skills.push({
                            id: data.rows.item(i).id,
                            name: data.rows.item(i).name,
                            department: dep[0],
                        });
                    });
                }
                console.log('Skills from DB: ', skills);
            }
        });
        return skills;
    }

    getSkill(id: ISkills['skillId']): Promise<ISkills[]> {
        const skill: ISkills[] = [];
        return this.databaseService.database.executeSql('SELECT * FROM skill WHERE id = ?', [id]).then(data => {
            if (data.rows.length > 0) {
                // this.departmentService.getDepartment(data.rows.item(0).department).then(dep => {
                    skill.push({
                        skillId: data.rows.item(0).id,
                        name: data.rows.item(0).name,
                        department: data.rows.item(0).department
                    });
                // });
            }
            return skill;
        });
    }

    addNewSkill(skill: any): Observable<ISkills[]> {
        let addSkill: Observable<ISkills[]>;
        const sId = require('uuid/v4');
        const query = 'INSERT INTO skill (id,name,department) VALUES (?,?,?)';
        const newSkill = [sId, skill.name, skill.departmentId];
        addSkill = from(this.databaseService.database.executeSql(query, newSkill).then(data => {
                        this.skillList = this.skillsFromDB();
                        return this.skillList;
        }));
        if (this.online) {
            this.http.post<ISkills[]>(`${this.ROOT_URL}` , skill, { headers: this.headers}).
                subscribe(api => console.log('New Skill added to server'),
                            error => console.log('Error on adding skill to server'));
        }
        return addSkill;
    }

    updateSkill(skill: any): Observable<void>  {
        console.log(skill, 'check skill');
        let editSkill: Observable<void>;
        const id = JSON.stringify(skill.id);
        const query = `UPDATE skill SET name = ? WHERE id = ${id}`;
        const changeSkill = [skill.name];
        editSkill = from(this.databaseService.database.executeSql(query, changeSkill).then(data => {
                            if (data.rowsAffected === 1) {
                                this.skillList = this.skillsFromDB();
                            } else {
                                console.log('error on adding to DB');
                            }
        }));
        if (this.online) {
            this.http.put<void>(`${this.ROOT_URL}/${skill.id}`, skill, {headers: this.headers}).
                subscribe(api => console.log('Editted in server'),
                            error => console.log('Error on editting at server'));
        }
        return editSkill;
    }

    delSkill(id: ISkills['skillId']): Observable<void> {
        let delSkill: Observable<void>;
        delSkill = from(this.databaseService.database.executeSql('DELETE FROM skill WHERE id = ?', [id]).then(_ => {
                            this.skillList = this.skillsFromDB();
                    }));
        if (this.online) {
            this.http.delete<void>(`${this.ROOT_URL}/${id}?force=true`, { headers: this.headers}).
                subscribe(api => console.log('Skill Deleted from server'),
                            error => console.log('Error on deleting from server'));
        }
        return delSkill;
    }

    getSkillsByDepartment(id: IDepartment['id']): Observable<any> {
        return new Observable<any>(observer => {
            let skills: ISkills[] = [];
            if (this.online) {
                // tslint:disable-next-line:max-line-length
                const skill = this.http.get<any[]>(`http://animus.api.daily2/api/v1/Departments/${id}/Skills`, { headers: this.headers });
                skill.subscribe(data => {Object.values(data)
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
                return {...item,
                        department: item.department.id
                        };
            });
            const modifiedJson = {
                        structure : {
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
}
