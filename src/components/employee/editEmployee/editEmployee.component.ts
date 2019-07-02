import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';

import { AlertService } from 'src/services/shared/alert.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { NetConnectionService } from 'src/services/shared/connection.service';
import { EmployeeService } from 'src/services/employee.service';
import { DepartmentService } from 'src/services/department.service';
import { DesignationService } from 'src/services/designation.service';
import { SkillService } from 'src/services/skill.service';

import { IEmployee, IProjects } from '../employee.interface';
import { IDepartment } from 'src/components/department/department.interface';
import { IDesignation } from 'src/components/designation/designation.interface';
import { ISkills } from 'src/components/skill/skill.interface';


@Component({
    selector: 'edit-employee',
    templateUrl: './editEmployee.component.html',
    styleUrls: ['./editEmployee.component.scss']
})

export class EditEmployeeComponent implements OnInit {
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

    private editEmployee: FormGroup = this.employeeForm.employeeFormBuilder;
    private selectedEmployee: IEmployee;
    private empId: IEmployee['id'];
    private departments: IDepartment[];
    private designations: IDesignation[];
    private skillsList: ISkills[];
    private offline: boolean;

    constructor(
        private employeeService: EmployeeService,
        private route: ActivatedRoute,
        private departmentService: DepartmentService,
        private designationService: DesignationService,
        private skillService: SkillService,
        private employeeForm: FormBuilderService,
        private formBuilder: FormBuilder,
        private netConnection: NetConnectionService,
        private alertService: AlertService,
        private location: Location) {
        this.netConnection.getConnectionState().subscribe(online => {
            if (online) {
                this.offline = false;
                this.designationService.designationsFromAPI().subscribe(desFromAPI => {
                    this.designations = desFromAPI;
                });
                this.departmentService.departmentsFromAPI().subscribe(depFromAPI => {
                    this.departments = depFromAPI;
                });
                this.skillService.skillsFromAPI().subscribe(skillFromAPI => {
                    this.skillsList = skillFromAPI;
                });
            } else {
                this.offline = true;
                this.designationService.designationsFromDB().then(desFromDB => {
                    this.designations = desFromDB;
                });
                this.departmentService.departmentsFromDB().then(depFromDB => {
                    this.departments = depFromDB;
                });
                this.skillService.skillsFromDB().then(skillFromDB => {
                    this.skillsList = skillFromDB;
                });
            }
        });
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            const id = params.get('id');
            this.empId = id;
        });

        this.employeeService.selectedEmployee(this.empId)
            .subscribe(data => (this.selectedEmployee = data,
                console.log('Selected Employee: ', this.selectedEmployee),
                this.initializeValue(this.selectedEmployee)),
                error => console.log(error));

    }

    initializeValue(selectedEmployee: IEmployee) {
        this.editEmployee.patchValue({
            id: selectedEmployee.id,
            firstName: selectedEmployee.firstName,
            lastName: selectedEmployee.lastName,
            displayName: selectedEmployee.displayName,
            startDate: selectedEmployee.startDate,
            resignationDate: selectedEmployee.resignationDate,
            resignationReason: selectedEmployee.resignationReason,
            email: selectedEmployee.email,
            employeeContactInfo: {
                id: selectedEmployee.employeeContactInfo.id,
                mobilePhone: selectedEmployee.employeeContactInfo.mobilePhone,
                homePhone: selectedEmployee.employeeContactInfo.homePhone,
                address: {
                    number: selectedEmployee.employeeContactInfo.address.number,
                    street: selectedEmployee.employeeContactInfo.address.street,
                    city: selectedEmployee.employeeContactInfo.address.city,
                }
            },
            department: selectedEmployee.department.id,
            designation: selectedEmployee.designation.id,
        });

        this.editEmployee.setControl('skills', this.setExistingSkills(selectedEmployee.skills));
        // this.editEmployee.setControl('currentProjects', this.setExistingProjects(selectedEmployee.currentProjects));
    }


    setExistingSkills(skillSet: ISkills[]): FormArray {
        console.log(Object.values(skillSet), 'check skills');
        const skillArray = new FormArray([]);
        if (this.offline) {
            console.log('here', skillSet.length);
        } else {
            skillSet.forEach(s => {
                skillArray.push(this.formBuilder.group({
                    skillId: s.skillId,
                    name: s.name,
                    // level: s.level
                }));
            });
        }
        return skillArray;
    }

    setExistingProjects(projectSet: IProjects[]): FormArray {
        const projectArray = new FormArray([]);
        projectSet.forEach(p => {
            projectArray.push(this.formBuilder.group({
                id: p.id,
                projectRoleId: p.projectRole.id,
                startDate: p.startDate,
                endDate: p.endDate,
                allocation: p.allocation,
                billingPercentage: p.billingPercentage,
                billingDescription: p.billingDescription
            }));
        });
        return projectArray;
    }

    updateEmployee() {
        this.editEmployee.patchValue({
            fullName: this.editEmployee.value.displayName
        });
        const confirm = this.alertService.confirmEdit('Employee', this.editEmployee.value.fullName);
        if (confirm) {
            this.employeeService.updateEmployee(this.editEmployee.value).subscribe(
                () => {
                    console.log('successfully edited');
                    this.location.back();
                },
                (error) => console.log('error: ', error)
            );
        }
    }
}
