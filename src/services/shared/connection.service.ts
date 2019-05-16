import { Injectable } from '@angular/core';
import { Observable, merge, of, fromEvent } from 'rxjs';
import { mapTo } from 'rxjs/operators';

@Injectable()
export class NetConnectionService {
    online$: Observable<boolean>;
    isConnected: boolean;

  constructor() {
    this.online$ = merge(
        of(navigator.onLine),
        fromEvent(window, 'online').pipe(mapTo(true)),
        fromEvent(window, 'offline').pipe(mapTo(false))
      );

    this.online$.subscribe(isOnline =>
          this.isConnected = isOnline
          );
  }
}
