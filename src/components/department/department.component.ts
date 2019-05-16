import { Component, OnInit } from '@angular/core';
import { DepartmentService } from 'src/services/department.service';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss'],
})
export class DepartmentComponent implements OnInit {

  public departments = [];
  errorMsg: any;

  constructor( private departmentService: DepartmentService) { }

  ngOnInit() {
    this.departmentService.getDepartments()
    .subscribe(data => (Object.values(data)
                          .map(list => this.departments = list),
                          console.log('List of Departments', this.departments)),
              error => (this.errorMsg = error, console.log(error)));
  }
}
