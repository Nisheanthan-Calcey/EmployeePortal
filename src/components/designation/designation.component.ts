import { Component } from '@angular/core';

import { AlertService } from 'src/services/shared/alert.service';
import { DesignationService } from 'src/services/designation.service';

import { IDesignation } from './designation.interface';

@Component({
  selector: 'app-designation',
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.scss'],
})
export class DesignationComponent {
  public designations: IDesignation[];

  constructor(private designationService: DesignationService,
              private alertService: AlertService) {
    this.designations = this.designationService.getDesignations();
    this.designationService.updateServer();
  }

  deleteDesignation(id: string) {
    const confirm = this.alertService.confirmDelete();
    if (confirm) {
      this.designationService.delDesignation(id).subscribe(
        () => {
          console.log('Successfully deleted');
        },
        (err) => console.log('error: ', err)
      );
    }
  }
}
