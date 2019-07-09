import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';

import { AlertService } from 'src/services/shared/alert.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { NetConnectionService, ConnectionStatus } from 'src/services/shared/connection.service';
import { DesignationService } from 'src/services/designation.service';
import { DepartmentService } from 'src/services/department.service';

import { IDesignation } from '../designation.interface';
import { IDepartment } from 'src/components/department/department.interface';

@Component({
    selector: 'edit-designation',
    templateUrl: './editDesignation.component.html',
    styleUrls: ['./editDesignation.component.scss']
})

export class EditDesignationComponent implements OnInit {
    private desId: IDesignation['id'];
    private designation: IDesignation;
    private department: IDepartment['displayName'];
    private offline: boolean;

    constructor(
        private designationForm: FormBuilderService,
        private route: ActivatedRoute,
        private designationService: DesignationService,
        private netConnectionService: NetConnectionService,
        private departmentService: DepartmentService,
        private alertService: AlertService,
        private location: Location) {
        this.netConnectionService.onNetworkChange().subscribe((status: ConnectionStatus) => {
            if (status === ConnectionStatus.Offline) {
                this.offline = true;
            }
        });
    }

    editDesignation: FormGroup = this.designationForm.designationFormBuilder;

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const id = params.get('id');
            this.desId = id;
        });

        if (this.offline) {
            this.designationService.getDesignation(this.desId).then((designation) => {
                this.designation = designation[0];
                this.initializeValues(this.designation);
            });
        } else {
            let desArray;
            this.designationService.designationsFromServer().subscribe(desFromAPI => {
                desArray = desFromAPI;
            });
            this.designation = this.getSelectedDesignation(desArray, this.desId);
            this.initializeValues(this.designation);
        }

    }

    getSelectedDesignation(designations: any, id: IDesignation['id']) {
        for (let d = 0; d <= designations.length; d++) {
            if (designations[d].id === id) {
                return designations[d];
            }
        }
    }

    initializeValues(des: IDesignation) {
        if (this.offline) {
            this.departmentService.getDepartment(des.department).then(dep => {
                this.department = dep[0].name;
            });
            this.editDesignation.patchValue({
                id: des.id,
                name: des.name,
                departmentId: des.department
            });
        } else {
            this.department = des.department.name;
            this.editDesignation.patchValue({
                id: des.id,
                name: des.name,
                departmentId: des.department.id
            });
        }
    }

    updateDesignation() {
        const confirm = this.alertService.confirmEdit('Designation', this.editDesignation.value.name);
        if (confirm) {
            this.designationService.updateDesignation(this.editDesignation.value).subscribe(
                () => {
                    console.log('successfully edited');
                    this.location.back();
                },
                error => console.log('error: ', error));
        }
    }
}
