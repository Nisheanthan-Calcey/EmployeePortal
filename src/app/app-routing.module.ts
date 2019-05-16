import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { HomePage } from './home/home.page';
import { EmployeeComponent } from 'src/components/employee/employee.component';
import { DepartmentComponent } from 'src/components/department/department.component';
import { DesignationComponent } from 'src/components/designation/designation.component';
import { SkillComponent } from 'src/components/skill/skill.component';
import { AddEmployeeComponent } from 'src/components/employee/addEmployee/addEmployee.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home',
    component: HomePage,
    children: [
      {
        path: 'employee',
        component: EmployeeComponent,
        children: [
          { path: 'addEmployee', component: AddEmployeeComponent}
        ]
      },
      {
        path: 'department',
        component: DepartmentComponent
      },
      {
        path: 'designation',
        component: DesignationComponent
      },
      {
        path: 'skill',
        component: SkillComponent
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
  AddEmployeeComponent
];
