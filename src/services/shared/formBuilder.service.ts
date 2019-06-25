import { Injectable } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

@Injectable()
export class FormBuilderService {
    private today: string = new Date().toISOString();

    constructor(private formBuilder: FormBuilder) {}

    departmentFormBuilder = this.formBuilder.group({
        id: [''],
        name: [''],
        displayName: ['', Validators.required]
    });

    designationFormBuilder = this.formBuilder.group({
        id: [''],
        departmentId: ['', Validators.required],
        name: ['', Validators.required]
    });

    skillFormBuilder = this.formBuilder.group({
        id: [''],
        name: ['', Validators.required],
        departmentId: ['', Validators.required]
    });

    employeeFormBuilder = this.formBuilder.group({
        id: ['', Validators.required],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        fullName: ['', Validators.required],
        displayName: [''],
        startDate: [this.today, Validators.required],
        resignationDate: '',
        resignationReason: '',
        email: ['', Validators.required],
        employeeContactInfo: this.formBuilder.group({
            id: [''],
            mobilePhone: [''],
            homePhone: [''],
            address: this.formBuilder.group({
                number: [''],
                street: [''],
                city: [''],
            })
        }),
        department: [''],
        designation: [''],
        skills: this.formBuilder.array([
            this.addSkills()
        ]),
        currentProjects: this.formBuilder.array([
            this.addProjects()
        ])
    });

    addSkills(): FormGroup {
        return this.formBuilder.group({
            skillId: '',
            level: 2
        });
    }
    addProjects(): FormGroup {
        return this.formBuilder.group({
            id: 'string',
            projectRoleId: 'string',
            startDate: this.today,
            endDate: '',
            allocation: 0,
            billingPercentage: 0,
            billingDescription: ''
        });
    }
}
