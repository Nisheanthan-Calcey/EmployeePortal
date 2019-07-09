import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLiteObject, SQLite } from '@ionic-native/sqlite/ngx';

@Injectable()
export class DatabaseService {
  public database: SQLiteObject;

  constructor(
    private plt: Platform,
    private sqlite: SQLite) {
    this.plt.ready().then(() => {
      this.sqlite.create({
        name: 'data.db',
        location: 'default',
      }).then((db: SQLiteObject) => {
        this.database = db;
      }).catch(e => console.log(e));
    });
  }

}
