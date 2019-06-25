import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { AlertService } from 'src/services/shared/alert.service';
import { EmployeeService } from 'src/services/employee.service';

import { IEmployee } from '../employee.interface';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss'],
})
export class EmployeeDetailComponent implements OnInit {
  empId: IEmployee['id'];
  employee: IEmployee[];

  constructor(private route: ActivatedRoute,
              private employeeService: EmployeeService,
              private alertService: AlertService) { }

  ngOnInit() {
    this.route.paramMap.subscribe( (params: ParamMap) => {
      const id = params.get('id');
      this.empId = id;
    });

    this.employeeService.selectedEmployee(this.empId)
    .subscribe( data => this.employee = data,
                error => console.log(error, 'error !!!'));
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
