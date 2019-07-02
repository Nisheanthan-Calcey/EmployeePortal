import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Location } from '@angular/common';

import { AlertService } from 'src/services/shared/alert.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { EmployeeService } from 'src/services/employee.service';
import { DepartmentService } from 'src/services/department.service';
import { DesignationService } from 'src/services/designation.service';
import { SkillService } from 'src/services/skill.service';

import { IDepartment } from 'src/components/department/department.interface';
import { IDesignation } from 'src/components/designation/designation.interface';
import { ISkills } from 'src/components/skill/skill.interface';
import { NetConnectionService } from 'src/services/shared/connection.service';

@Component({
    selector: 'add-employee',
    templateUrl: './addEmployee.component.html',
    styleUrls: ['./addEmployee.component.scss']
})

export class AddEmployeeComponent {
    basicDetails = [
        {
            name: 'firstName',
            placeholder: 'First Name*'
        },
        {
            name: 'lastName',
            placeholder: 'Last Name*'
        },
        {
            name: 'displayName',
            placeholder: 'Full Name*'
        },
        {
            name: 'email',
            placeholder: 'Email*'
        },
    ];
    contactDetails = [
        {
            name: 'mobilePhone',
            placeholder: 'Mobile Number'
        },
        {
            name: 'homePhone',
            placeholder: 'Home Phone'
        }
    ];
    address = [
        {
            name: 'number',
            placeholder: 'Residential Number'
        },
        {
            name: 'street',
            placeholder: 'Street'
        },
        {
            name: 'city',
            placeholder: 'Town'
        }
    ];
    private newEmployee: FormGroup = this.employeeForm.employeeFormBuilder;
    private departments: IDepartment[];
    private designations: IDesignation[];
    private skillsList: ISkills[];

    constructor(
        private employeeService: EmployeeService,
        private departmentService: DepartmentService,
        private designationService: DesignationService,
        private skillService: SkillService,
        private employeeForm: FormBuilderService,
        private alertService: AlertService,
        private location: Location,
        private netConnection: NetConnectionService) {
        this.netConnection.getConnectionState().subscribe(online => {
            if (online) {
                this.departmentService.departmentsFromAPI().subscribe(depFromAPI => {
                    this.departments = depFromAPI;
                });
                this.departmentService.updateServer();
            } else {
                this.departmentService.departmentsFromDB().then(depFromDB => {
                    this.departments = depFromDB;
                });
            }
        });
        this.subscribeChanges();
    }

    subscribeChanges() {
        this.newEmployee.controls.department.valueChanges.subscribe(
            (id) => {
                if (id != null) {
                    this.designationService.getDesignationsByDepartment(id).subscribe(data => {
                        console.log('Designations under selected department: ', data);
                        this.designations = data;
                    });
                    this.skillService.getSkillsByDepartment(id).subscribe(data => {
                        console.log('Skills under selected department: ', data);
                        this.skillsList = data;
                    });
                }
            }
        );
        this.newEmployee.controls.skills.valueChanges.subscribe(
            (newSkill) => {
                console.log(newSkill, 'change detected');
            }
        );
    }

    addEmployee() {
        this.newEmployee.patchValue({
            fullName: this.newEmployee.value.displayName,
        });
        const confirm = this.alertService.confirmAdd('Employee', this.newEmployee.value.displayName);
        if (confirm) {
            const addEmp = this.employeeService.addNewEmployee(this.newEmployee.value);
            if (addEmp != null) {
                addEmp.subscribe(
                    (data) => {
                        console.log('successfully added employee: ', data);
                        this.location.back();
                    },
                    (error) => console.log('error: ', error)
                );
            }
        }
    }
}
