import { Component, OnInit } from '@angular/core';
import { DesignationService } from 'src/services/designation.service';

@Component({
  selector: 'app-designation',
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.scss'],
})
export class DesignationComponent implements OnInit {

  public designations = [];
  errorMsg: any;

  constructor( private designationService: DesignationService) { }

  ngOnInit() {
    this.designationService.getDesignations()
    .subscribe(data => (Object.values(data)
                          .map(list => this.designations = list),
                          console.log('List of Designations', this.designations)),
              error => (this.errorMsg = error, console.log(error)));
  }
}
