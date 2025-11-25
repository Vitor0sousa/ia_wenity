import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNavComponent } from '../../components/side-nav/side-nav';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, SideNavComponent], // <--- Importante!
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {}