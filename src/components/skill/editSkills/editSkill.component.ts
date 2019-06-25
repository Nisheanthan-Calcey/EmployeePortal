import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';

import { SkillService } from 'src/services/skill.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { AlertService } from 'src/services/shared/alert.service';

import { IDepartment } from 'src/components/department/department.interface';
import { ISkills } from '../skill.interface';
import { NetConnectionService } from 'src/services/shared/connection.service';
import { DepartmentService } from 'src/services/department.service';

@Component({
    selector: 'edit-skill',
    templateUrl: './editSkill.component.html',
    styleUrls: ['./editSkill.component.scss']
})

export class EditSkillComponent implements OnInit {
    private skillId: ISkills['skillId'];
    private skill: ISkills;
    private department: IDepartment['displayName'];
    private editSkill: FormGroup;
    private offline: boolean;

    constructor(private skillForm: FormBuilderService,
                private route: ActivatedRoute,
                private skillService: SkillService,
                private netConnection: NetConnectionService,
                private departmentService: DepartmentService,
                private alertService: AlertService,
                private location: Location) {
                    this.netConnection.getConnectionState().subscribe(online => {
                        if (online) {
                            this.offline = false;
                        } else {
                            this.offline = true;
                        }
                    });
                }

    ngOnInit() {
        this.editSkill = this.skillForm.skillFormBuilder;

        this.route.paramMap.subscribe( (params: ParamMap) => {
            const id = params.get('id');
            this.skillId = id;
          });

        if (this.offline) {
            this.skillService.getSkill(this.skillId).then((skills) => {
                this.skill = skills[0];
                this.initializeValues(this.skill);
            });
        } else {
            const skillArray = this.skillService.getSkills();
            this.skill = this.getSelectedSkill(skillArray, this.skillId);
            this.initializeValues(this.skill);
        }
    }

    getSelectedSkill(skills: any, id: ISkills['skillId']) {
        for (let s = 0; s <= skills.length; s++) {
            if (skills[s].id === id) {
                return skills[s];
            }
        }
    }

    initializeValues(skill: any) {
        console.log(skill, 'skill from api');
        if (this.offline) {
            this.departmentService.getDepartment(skill.department).then(dep => {
                this.department = dep[0].name;
            });
            this.editSkill.patchValue({
                id: skill.skillId,
                name: skill.name,
                departmentId: skill.department
            });
        } else {
            this.department = skill.department.name;
            this.editSkill.patchValue({
                id: skill.id,
                name: skill.name,
                departmentId: skill.department.id
            });
        }
    }

    updateSkill() {
        const confirm = this.alertService.confirmEdit('Employee', this.editSkill.value.name);
        if (confirm) {
            this.skillService.updateSkill(this.editSkill.value).subscribe(
                () => {
                    console.log('successfully edited');
                    this.location.back();
                },
                error => console.log('error: ', error));
        }
    }
}
