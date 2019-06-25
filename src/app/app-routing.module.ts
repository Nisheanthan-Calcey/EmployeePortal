import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { HomePage } from './home/home.page';

import { EmployeeComponent } from 'src/components/employee/employee.component';
import { DepartmentComponent } from 'src/components/department/department.component';
import { DesignationComponent } from 'src/components/designation/designation.component';
import { SkillComponent } from 'src/components/skill/skill.component';

import { AddEmployeeComponent } from 'src/components/employee/addEmployee/addEmployee.component';
import { EditEmployeeComponent } from 'src/components/employee/editEmployee/editEmployee.component';
import { EmployeeDetailComponent } from 'src/components/employee/employee-detail/employee-detail.component';

import { AddDepartmentComponent } from 'src/components/department/addDepartment/addDepartment.component';
import { EditDepartmentComponent } from 'src/components/department/editDepartment/editDepartment.component';

import { AddDesignationComponent } from 'src/components/designation/addDesignation/addDesignation.component';
import { EditDesignationComponent } from 'src/components/designation/editDesignation/editDesignation.component';

import { AddSkillComponent } from 'src/components/skill/addSkills/addSkill.component';
import { EditSkillComponent } from 'src/components/skill/editSkills/editSkill.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home',
    component: HomePage,
    children: [
      {
        path: 'employee',
        component: EmployeeComponent,
      },
      {
        path: 'employee/:id',
        component: EmployeeDetailComponent,
      },
      {
        path: 'addEmployee',
        component: AddEmployeeComponent
      },
      {
        path: 'editEmployee/:id',
        component: EditEmployeeComponent
      },
      {
        path: 'department',
        component: DepartmentComponent
      },
      {
        path: 'addDepartment',
        component: AddDepartmentComponent
      },
      {
        path: 'editDepartment/:id',
        component: EditDepartmentComponent
      },
      {
        path: 'designation',
        component: DesignationComponent
      },
      {
        path: 'addDesignation',
        component: AddDesignationComponent
      },
      {
        path: 'editDesignation/:id',
        component: EditDesignationComponent
      },
      {
        path: 'skill',
        component: SkillComponent
      },
      {
        path: 'addSkill',
        component: AddSkillComponent
      },
      {
        path: 'editSkill/:id',
        component: EditSkillComponent
      }
    ] },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes , { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
export const routingComponents = [
  EmployeeComponent,
  DepartmentComponent,
  DesignationComponent,
  SkillComponent,
  EmployeeDetailComponent,
  AddEmployeeComponent,
  EditEmployeeComponent,
  AddDepartmentComponent,
  EditDepartmentComponent,
  AddDesignationComponent,
  EditDesignationComponent,
  AddSkillComponent,
  EditSkillComponent
];
