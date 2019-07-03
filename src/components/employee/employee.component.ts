import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService } from 'src/services/shared/alert.service';
import { EmployeeService } from 'src/services/employee.service';

import { IEmployee } from './employee.interface';
import { NetConnectionService } from 'src/services/shared/connection.service';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
})
export class EmployeeComponent {
  public employees: IEmployee[];

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private alertService: AlertService,
    private netConnectionService: NetConnectionService) {
    this.netConnectionService.getConnectionState().subscribe(online => {
      if (online) {
        this.employeeService.employeesFromAPI().subscribe(empFromAPI => {
          this.employees = empFromAPI;
        });
      } else {
        this.employeeService.employeesFromDB().then(empFromDB => {
          this.employees = empFromDB;
        });
      }
    });
  }

  selectEmployee(id: string) {
    this.router.navigate(['home/employee', id]);
  }

  deleteEmployee(id: string) {
    const confirm = this.alertService.confirmDelete();
    if (confirm) {
      this.employeeService.delEmployee(id).subscribe(
        () => console.log('Successfully deleted'),
        (err) => console.log('error: ', err)
      );
    }
  }
}
