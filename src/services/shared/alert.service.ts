import { Injectable } from '@angular/core';

@Injectable()
export class AlertService {
    constructor() {}

    confirmAdd(type: string, field: any): boolean {
        return confirm(`You are Adding new '${type}' with the name of '${field}'`);
    }

    confirmEdit(type: string, field: any): boolean {
        return confirm(`You are Editing '${type}: ${field}'`);
    }

    confirmDelete(): boolean {
        return confirm(`Are you sure, Do you want to Delete`);
    }
}
