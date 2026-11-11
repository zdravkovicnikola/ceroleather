import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf container">
      <p class="eyebrow">404</p>
      <h1 class="display display--xl">Skrenuli ste<br /><span class="text-red">s puta.</span></h1>
      <p class="lead">Stranica koju tražite ne postoji.</p>
      <a routerLink="/" class="btn btn--primary">Nazad na početnu <span class="btn__arrow"></span></a>
    </section>
  `,
  styles: `
    .nf {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 28px;
      padding-top: var(--header-h);
    }
    .nf .btn {
      align-self: flex-start;
    }
  `,
})
export class NotFoundPage {}
