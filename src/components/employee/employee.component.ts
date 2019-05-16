import { Component, OnInit } from '@angular/core';
import { EmployeeService } from 'src/services/employee.service';
import { NetConnectionService } from 'src/services/shared/connection.service';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
})
export class EmployeeComponent implements OnInit {

  public employees = [];
  errorMsg: any;

  constructor(private employeeService: EmployeeService) { }

  ngOnInit() {
    this.employeeService.getEmployees()
    .subscribe( data => (Object.values(data)
                          .map(list => this.employees = list),
                          console.log( 'List of Employees' , this.employees)),
                error => (this.errorMsg = error, console.log(error)));
  }

  routeAddEmp() {
    console.log('directing..');
  }
}
