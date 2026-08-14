const commitTypes = [
  "feat",
  "fix",
  "refactor",
  "chore",
  "docs",
  "style",
  "test",
];

const commitHeaderPattern = /^([a-z]+): (.+) \(#[0-9]+\)$/u;
const issueReferencePattern = /\(#[0-9]+\)/u;

const headerFormatRule = ({ header = "" }) => {
  const match = commitHeaderPattern.exec(header);

  if (!match) {
    return [
      false,
      "커밋 메시지는 type: subject (#이슈번호) 형식이어야 합니다.",
    ];
  }

  const [, type, subject] = match;

  if (!commitTypes.includes(type)) {
    return [false, `type은 ${commitTypes.join(", ")} 중 하나여야 합니다.`];
  }

  if (subject.trim() !== subject) {
    return [false, "type 뒤와 이슈 번호 앞에는 공백을 하나만 사용해야 합니다."];
  }

  if (subject.endsWith(".")) {
    return [false, "subject 끝에는 마침표를 붙일 수 없습니다."];
  }

  if (issueReferencePattern.test(subject)) {
    return [false, "커밋 하나에는 이슈 번호를 하나만 사용할 수 있습니다."];
  }

  return [true];
};

const config = {
  plugins: [
    {
      rules: {
        "header-format": headerFormatRule,
      },
    },
  ],
  rules: {
    "header-format": [2, "always"],
  },
};

export default config;
