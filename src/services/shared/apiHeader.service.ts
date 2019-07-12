import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

@Injectable()
export class ApiHeaderService {

    header = new HttpHeaders().set('Authorization',
        // tslint:disable-next-line:max-line-length
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIxMzZiZGY4MS0zOTdiLTRlNjgtYmViZS04ODM5ODNiOWNkM2MiLCJzdWIiOiJhZG1pbkBjYWxjZXkuY29tIiwiU1UiOiJGYWxzZSIsIm5iZiI6MTU2Mjc2MzAxOCwiZXhwIjoxNTYyNzY2NjE4LCJpc3MiOiJhbmltdXMubG9jYWwuYXBpIiwiYXVkIjoiYW5pbXVzLmxvY2FsLndlYiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6WyJNYW5hZ2VyIiwiQWRtaW4iXX0.A7SiEpyJ94l8O2nP6x62VXiJ3Bq44RSTJ_bNoD-kzL4');
}

