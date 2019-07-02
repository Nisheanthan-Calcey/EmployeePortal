import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';

import { AlertService } from 'src/services/shared/alert.service';
import { NetConnectionService } from 'src/services/shared/connection.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { DepartmentService } from 'src/services/department.service';

import { IDepartment } from '../department.interface';

@Component({
    selector: 'edit-department',
    templateUrl: './editDepartment.component.html',
    styleUrls: ['./editDepartment.component.scss']
})

export class EditDepartmentComponent implements OnInit {
    private depId: IDepartment['id'];
    private department: IDepartment;
    private offline: boolean;

    constructor(
        private departmentService: DepartmentService,
        private route: ActivatedRoute,
        private departmentForm: FormBuilderService,
        private netConnection: NetConnectionService,
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

    editDepartment: FormGroup = this.departmentForm.departmentFormBuilder;

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const id = params.get('id');
            this.depId = id;
        });

        if (this.offline) {
            this.departmentService.getDepartment(this.depId).then((department) => {
                this.department = department[0];
                this.initializeValues(this.department);
            });
        } else {
            let depArray;
            this.departmentService.departmentsFromAPI().subscribe(depFromAPI => {
                depArray = depFromAPI;
            });
            this.department = this.getSelectedDepartment(depArray, this.depId);
            this.initializeValues(this.department);
        }
    }

    getSelectedDepartment(departments: any, id: IDepartment['id']) {
        for (let d = 0; d <= departments.length; d++) {
            if (departments[d].id === id) {
                return departments[d];
            }
        }
    }

    initializeValues(dep: IDepartment) {
        this.editDepartment.patchValue({
            id: dep.id,
            displayName: dep.name,
            name: dep.name,
        });
    }

    updateDepartment() {
        if (this.editDepartment.value.name) {
            const confirm = this.alertService.confirmEdit('Department', this.editDepartment.value.name);
            if (confirm) {
                this.departmentService.updateDepartment(this.editDepartment.value).subscribe(
                    () => {
                        console.log('successfully edited');
                        this.location.back();
                    },
                    (error) => console.log('error: ', error)
                );
            }
        } else {
            alert('All Fields are Mandatory');
        }
    }
}
