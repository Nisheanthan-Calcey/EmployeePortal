import { Component } from '@angular/core';

import { NetConnectionService } from 'src/services/shared/connection.service';
import { DatabaseService } from 'src/services/shared/database.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  private offline: boolean;

  constructor(private netConnection: NetConnectionService,
              private dbService: DatabaseService) {
                  this.netConnection.getConnectionState().subscribe(online => {
                    if (online) {
                        this.offline = false;
                    } else {
                        this.offline = true;
                        // this.dbService.database.open().then(db => {
                        //   console.log('offline and opening DB', db);
                        // });
                    }
                  });
  }
}
