import fs from 'fs';
import path from 'path';
import parse from '../es';

test('it matches the snapshot for each app example fixture', () => {
  const fixturesPath = path.resolve(__dirname, './fixtures');
  const examplePaths = fs
    .readdirSync(fixturesPath)
    .map((filename) => path.join(fixturesPath, filename));

  examplePaths.forEach((demoPath) => {
    const demoContent = fs.readFileSync(demoPath, 'utf8');
    const result = {
      result: parse(demoContent),
      name: path.basename(demoPath),
    };

    expect(result).toMatchSnapshot();
  });
});
