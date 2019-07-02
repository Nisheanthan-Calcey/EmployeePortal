import { Component } from '@angular/core';

import { AlertService } from 'src/services/shared/alert.service';
import { DesignationService } from 'src/services/designation.service';

import { IDesignation } from './designation.interface';
import { NetConnectionService } from 'src/services/shared/connection.service';

@Component({
  selector: 'app-designation',
  templateUrl: './designation.component.html',
  styleUrls: ['./designation.component.scss'],
})
export class DesignationComponent {
  public designations: IDesignation[];

  constructor(
    private designationService: DesignationService,
    private alertService: AlertService,
    private netConnectionService: NetConnectionService) {
    this.netConnectionService.getConnectionState().subscribe(online => {
      if (online) {
        this.designationService.designationsFromAPI().subscribe(apiDes => {
          this.designations = apiDes;
        });
        this.designationService.updateServer();
      } else {
        this.designationService.designationsFromDB().then(des => {
          this.designations = des;
        });
      }
    });
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
