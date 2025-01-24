type Structure = { [key: string]: string | {} };

function createTree(structure: Structure, indent: string = ''): void {
  const keys = Object.keys(structure);
  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    console.log(indent + prefix + key);

    const value = structure[key];
    if (typeof value === 'object' && value !== null) {
      const nextIndent = isLast ? indent + '    ' : indent + '│   ';
      createTree(value as Structure, nextIndent); // Recursively process child objects
    }
  });
}

export default createTree;