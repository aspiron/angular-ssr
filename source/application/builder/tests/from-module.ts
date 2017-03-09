import {Router} from '@angular/router';

import {
  BasicExternalComponent,
  BasicExternalStyledComponent,
  BasicInlineComponent,
  BasicRoutedModule,
  loadApplicationFixtureFromModule,
  renderComponentFixture,
  renderModuleFixture,
  moduleFromComponent,
  trimDocument,
} from '../../../test/fixtures';

import {ApplicationFromModule} from '../../../application';

import {ConsoleType} from '../../../snapshot';

import {extractRoutesFromRouter} from '../../../route';

describe('ApplicationFromModule', () => {
  it('should require a template document in order to render', done => {
    const application = new ApplicationFromModule(moduleFromComponent(BasicInlineComponent));
    application.prerender()
      .then(() => {
        done.fail(new Error('render should fail due to missing template document'));
      })
      .catch(exception => done());
  });

  it('should be able to render a Hello World application with inline template', done => {
    renderComponentFixture(BasicInlineComponent)
      .then(snapshots => {
        snapshots.subscribe(
          snapshot => {
            const expr = /<application ng-version="([\d\.]+)"><div>Hello!<\/div><\/application>/;
            expect(snapshot.exceptions).not.toBeNull();
            expect(snapshot.exceptions.length).toBe(0);
            expect(snapshot.variant).toBeUndefined();
            expect(snapshot.applicationState).toBeUndefined();
            expect(expr.test(trimDocument(snapshot.renderedDocument))).toBeTruthy();
            done();
          },
          exception => done.fail(exception));
      })
      .catch(exception => done.fail(exception));
  });

  it('should be able to render a Hello World application with external template', done => {
    renderComponentFixture(BasicExternalComponent)
      .then(snapshots => {
        snapshots.subscribe(
          snapshot => {
            const expr = /<application ng-version="([\d\.]+)"><div>Hello!<\/div><\/application>/;
            expect(snapshot.exceptions).not.toBeNull();
            expect(snapshot.exceptions.length).toBe(0);
            expect(snapshot.variant).toBeUndefined();
            expect(snapshot.applicationState).toBeUndefined();
            expect(expr.test(trimDocument(snapshot.renderedDocument))).toBeTruthy();
            done();
          },
          exception => done.fail(exception));
      })
      .catch(exception => done.fail(exception));
  });

  it('should be able to render a Hello World application with external template and SCSS styles', done => {
    renderComponentFixture(BasicExternalStyledComponent)
      .then(snapshots => {
        snapshots.subscribe(
          snapshot => {
            const expr = /<style>div\[_ngcontent-([a-z\d]{3})-(\d)\] { background-color: black;/;
            expect(snapshot.exceptions).not.toBeNull();
            expect(snapshot.exceptions.length).toBe(0);
            expect(snapshot.variant).toBeUndefined();
            expect(snapshot.applicationState).toBeUndefined();
            expect(expr.test(trimDocument(snapshot.renderedDocument))).toBeTruthy();
            done();
          },
          exception => done.fail(exception));
      })
      .catch(exception => done.fail(exception));
  });

  it('should be able to render an application that uses the router', done => {
    let expectedCount = 2;

    renderModuleFixture(BasicRoutedModule)
      .then(snapshots => {
        snapshots.subscribe(
          snapshot => {
            expect(snapshot.exceptions).not.toBeNull();
            expect(snapshot.exceptions.length).toBe(0);
            expect(snapshot.variant).toBeUndefined();
            expect(snapshot.applicationState).toBeUndefined();
            expect(/Routed/.test(trimDocument(snapshot.renderedDocument))).toBeTruthy();

            if (--expectedCount === 0) {
              done();
            }
          },
          exception => done.fail(exception));
      })
      .catch(exception => done.fail(exception));
  });

  it('should be able to transmit state from the server to the client in the prerendered document', done => {
    const module = loadApplicationFixtureFromModule(BasicRoutedModule);

    module.stateReader(
      injector => {
        const router = injector.get(Router);
        const routes = extractRoutesFromRouter(router);
        return Promise.resolve(routes.map(r => r.path));
      });

    module.prerender()
      .then(snapshots => {
        snapshots.subscribe(
          snapshot => {
            expect(snapshot.applicationState).not.toBeNull();
            expect(Array.isArray(snapshot.applicationState)).toBeTruthy();
            const expr = /<script type="text\/javascript">window.bootstrapApplicationState = \[\[\],\["one"\]\];<\/script>/;
            expect(expr.test(trimDocument(snapshot.renderedDocument))).toBeTruthy();
            done();
          });
      })
      .catch(exception => done.fail(exception));
  });

  it('can collect console log statements that happen during application execution', done => {
    const module = loadApplicationFixtureFromModule(BasicRoutedModule);

    module.prerender()
      .then(snapshots => {
        snapshots.subscribe(
          snapshot => {
            expect(snapshot.console).not.toBeNull();
            expect(Array.isArray(snapshot.console)).toBeTruthy();
            expect(snapshot.console.length).toBe(1);
            expect(snapshot.console[0].type).toBe(ConsoleType.Log);
            expect(snapshot.console[0].args.length).toBe(1);
            expect(/enableProdMode/.test(snapshot.console[0].args[0])).toBeTruthy();
            done();
          });
      })
      .catch(exception => done.fail(exception));
  });
});