import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

import { AlertService } from 'src/services/shared/alert.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { DepartmentService } from 'src/services/department.service';
import { NetConnectionService, ConnectionStatus } from 'src/services/shared/connection.service';

@Component({
    selector: 'add-department',
    templateUrl: './addDepartment.component.html',
    styleUrls: ['./addDepartment.component.scss']
})

export class AddDepartmentComponent {
    private newDepartment: FormGroup = this.departmentForm.departmentFormBuilder;
    private online: boolean;
    constructor(
        private departmentService: DepartmentService,
        private departmentForm: FormBuilderService,
        private alertService: AlertService,
        private location: Location,
        private netConnectionService: NetConnectionService) {
        this.netConnectionService.onNetworkChange().subscribe((status: ConnectionStatus) => {
            if (status === ConnectionStatus.Online) {
                this.online = true;
            }
        });
    }

    addDepartment() {
        if (this.newDepartment.value.name) {
            const depId = require('uuid/v4');
            this.newDepartment.patchValue({
                id: depId(),
                displayName: this.newDepartment.value.name
            });
            const confirm = this.alertService.confirmAdd('Department', this.newDepartment.value.name);
            if (confirm) {
                const addDepartment = this.departmentService.addDepToDB(this.newDepartment.value);
                if (addDepartment != null) {
                    addDepartment.subscribe(
                        (data) => {
                            console.log('successfully added department: ', data);
                            this.location.back();
                        },
                        (error) => console.log('error: ', error)
                    );
                }
                if (this.online) {
                    this.departmentService.addDepToServer(this.newDepartment.value);
                }
            }
        } else {
            alert('All Fields are Mandatory');
        }
    }
}

