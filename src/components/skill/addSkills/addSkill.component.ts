import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

import { AlertService } from 'src/services/shared/alert.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { DepartmentService } from 'src/services/department.service';
import { SkillService } from 'src/services/skill.service';

import { IDepartment } from 'src/components/department/department.interface';
import { NetConnectionService, ConnectionStatus } from 'src/services/shared/connection.service';

@Component({
    selector: 'add-skill',
    templateUrl: './addSkill.component.html',
    styleUrls: ['./addSkill.component.scss']
})

export class AddSkillComponent {
    private newSkill: FormGroup = this.skillForm.skillFormBuilder;
    private departments: IDepartment[];

    constructor(
        private departmentService: DepartmentService,
        private skillService: SkillService,
        private skillForm: FormBuilderService,
        private alertService: AlertService,
        private location: Location,
        private netConnectionService: NetConnectionService) {
        this.netConnectionService.onNetworkChange().subscribe((status: ConnectionStatus) => {
            if (status === ConnectionStatus.Offline) {
                this.departmentService.departmentsFromDB().then(depFromDB => {
                    this.departments = depFromDB;
                });
            } else {
                this.departmentService.departmentsFromServer().subscribe(depFromAPI => {
                    this.departments = depFromAPI;
                });
            }
        });
    }

    addSkill() {
        if (this.newSkill.value.departmentId && this.newSkill.value.name) {
            const skillId = require('uuid/v4');
            this.newSkill.patchValue({
                id: skillId()
            });
            const confirm = this.alertService.confirmAdd('Skill', this.newSkill.value.name);
            if (confirm) {
                const addSkill = this.skillService.addSkillToDB(this.newSkill.value);
                if (addSkill != null) {
                    addSkill.subscribe(
                        (data) => {
                            console.log('successfully added skill: ', data);
                            this.location.back();
                        },
                        (error) => console.log('error: ', error)
                    );
                }
            }
        } else {
            alert('All Fields are Mandatory');
        }
    }
}
