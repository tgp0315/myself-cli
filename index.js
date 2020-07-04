#!/usr/bin/env node
const program = require("commander");
const download = require("download-git-repo");
const inquirer = require("inquirer");
const fs = require("fs");
const chalk = require("chalk");
const shell = require("shelljs");
const child =require("child_process");
const symbols = require("log-symbols");
program
.version('0.0.1', "-v, --version")
.command("init <name>")
.description("初始化组件模板")
.action( name => {
  if(fs.existsSync(name)) {
    console.log(symbols.error, chalk.red("项目已存在"));
  }
  inquirer
  .prompt([
    {
      name: "description",
      message: "请输入项目描述"
    },
    {
      name: "author",
      message: "请输入作者名称"
    },
    {
      name: "giturl",
      message: "请输入仓库地址"
    },
    {
      message: "请输入项目类型",
      name: "type",
    },
  ])
  .then(answers => {
    console.log("正在下载模板，请耐心等待...");
    downLoadTemplate(`direct:${answers.giturl}/${answers.type}.git#master`, name)
    .then(() => {
      console.log(symbols.success, chalk.green("项目初始化完成"));
      const meta = {
        name,
        description: answers.description,
        author: answers.author
      };
      const fileName = `${name}/package.json`;
      updateJsonFile(fileName, meta)
      .then(async () => {
        console.log("配置文件更新完成");
        await shell.cd(name);
        await shell.rm("-rf", "./.git");
        await loadCmd(`cnpm i`)
      })
    }).catch(err => {
      console.log(symbols.error, chalk.red(`拉取远程仓库失败${err}`));
    })
  })
})
let updateJsonFile = (fileName, obj) => {
  return new Promise((resolve) => {
      if(fs.existsSync(fileName)) {
        // 读出模板下的package.json文件
        const data = fs.readFileSync(fileName).toString();
        let json = JSON.parse(data);
        Object.keys(obj).forEach(key => {
            json[key] = obj[key];
        });
        fs.writeFileSync(fileName, JSON.stringify(json, null, '\t'), 'utf-8');
        resolve();
      }
  });
}
// 项目模块远程下载
let downLoadTemplate = async (api, ProjectName) => {
  return new Promise((resolve, reject) => {
    download(api, ProjectName, {clone: true}, (err) => {
      if(err) {
        console.log(symbols.error, chalk.red(`模板下载失败${err}`));
        reject(err);
      }else{
        resolve();
      }
    });
  });
};
let loadCmd = async(cmd, text) =>{
  console.log("正在安装依赖，请耐心等待...");
  await child.exec(cmd, async (error, stdout, stderr) => {
    if(error) {
      console.log(symbols.error, chalk.red(`安装依赖失败${error}`));
      return;
    }
    console.log(symbols.success, chalk.green(`安装依赖成功`))
    await shell.exit(1);
  });
}
program.parse(process.argv);
