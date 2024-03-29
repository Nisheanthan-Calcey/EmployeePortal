import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

import { AlertService } from 'src/services/shared/alert.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { DesignationService } from 'src/services/designation.service';
import { DepartmentService } from 'src/services/department.service';

import { IDepartment } from 'src/components/department/department.interface';
import { NetConnectionService, ConnectionStatus } from 'src/services/shared/connection.service';

@Component({
    selector: 'add-designation',
    templateUrl: './addDesignation.component.html',
    styleUrls: ['./addDesignation.component.scss']
})

export class AddDesignationComponent {
    private newDesignation: FormGroup = this.designationForm.designationFormBuilder;
    private departments: IDepartment[];

    constructor(
        private designationService: DesignationService,
        private departmentService: DepartmentService,
        private designationForm: FormBuilderService,
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

    addDesignation() {
        if (this.newDesignation.value.departmentId && this.newDesignation.value.name) {
            const desId = require('uuid/v4');
            this.newDesignation.patchValue({
                id: desId()
            });
            const confirm = this.alertService.confirmAdd('Designation', this.newDesignation.value.name);
            if (confirm) {
                const addDesignation = this.designationService.addDesToDB(this.newDesignation.value);
                if (addDesignation != null) {
                    addDesignation.subscribe(
                        (data) => {
                            console.log('successfully added designation: ', data);
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
