import { Component } from '@angular/core';

import { DatabaseService } from 'src/services/shared/database.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(
    private dbService: DatabaseService) { }
}
