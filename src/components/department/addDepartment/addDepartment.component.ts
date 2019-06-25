import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

import { AlertService } from 'src/services/shared/alert.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { DepartmentService } from 'src/services/department.service';

@Component({
    selector: 'add-department',
    templateUrl: './addDepartment.component.html',
    styleUrls: ['./addDepartment.component.scss']
})

export class AddDepartmentComponent {
    private newDepartment: FormGroup = this.departmentForm.departmentFormBuilder;

    constructor(private departmentService: DepartmentService,
                private departmentForm: FormBuilderService,
                private alertService: AlertService,
                private location: Location) {}

    addDepartment() {
        if (this.newDepartment.value.name) {
            this.newDepartment.patchValue({
                displayName: this.newDepartment.value.name
            });
            const confirm = this.alertService.confirmAdd('Department', this.newDepartment.value.name);
            if (confirm) {
                const addDepartment = this.departmentService.addNewDepartment(this.newDepartment.value);
                if (addDepartment != null) {
                    addDepartment.subscribe(
                        (data) => {
                            console.log('successfully added department: ', data);
                            this.location.back();
                        },
                        (error) =>  console.log('error: ', error)
                    );
                }
            }
        } else {
            alert('All Fields are Mandatory');
        }
    }
}

