# Way of Pi - Coding Agent Guide

## Quick Start Guide

### 1. Core Workflow
```bash
# 1. Check available tools
ls -la /home/zerwiz/CodeP/WayPi/waypi

# 2. View current environment
source /home/zerwiz/CodeP/WayPi/waypi/bin/activate

# 3. Start coding session
echo "Welcome to Way of Pi - Coding Agent Environment"
```

### 2. Important Directories
- `/home/zerwiz/CodeP/WayPi/waypi/` - Main working directory
- `/home/zerwiz/CodeP/WayPi/waypi/src/` - Source code
- `/home/zerwiz/CodeP/WayPi/waypi/tests/` - Test files
- `/home/zerwiz/CodeP/WayPi/waypi/bin/` - Executable scripts

### 3. Key Tools Overview

#### Python-based WayPi Agent
- **Purpose**: AI-assisted coding environment
- **Features**:
  - Code generation and analysis
  - Testing frameworks integration
  - Documentation generation
  - Real-time code reviews
- **Installation**:
  ```bash
  cd /home/zerwiz/CodeP/WayPi/waypi
  pip install -e .
  ```

#### Linux Coding Environment
- **Shell**: Bash/Zsh integrated environment
- **Tools**:
  - `nano` for quick edits
  - `vim` for advanced editing
  - `tmux` for terminal multiplexing
  - `screen` for session management

#### File Management
- **Read files**:
  ```bash
  cat filename.txt
  less filename.log
  ```

#### Environment Setup
- **Activate virtual environment**:
  ```bash
  source /home/zerwiz/CodeP/WayPi/waypi/bin/activate
  ```

### 4. Agent Capabilities

#### Code Generation
- Generate code from specifications
- Create unit tests
- Write documentation
- Refactor existing code

#### Code Analysis
- Static code analysis
- Security scanning
- Performance profiling
- Dependency checking

#### Testing
- Run tests with `pytest`
- Code coverage reports
- Integration testing
- Manual testing support

#### Debugging
- Integrate with debuggers
- Log analysis
- Error tracking

### 5. Project Structure

```
/home/zerwiz/CodeP/
├── WayPi/
│   ├── waypi/
│   │   ├── bin/
│   │   ├── lib/
│   │   ├── src/
│   │   ├── tests/
│   │   └── README.md
│   └── Documentation/
│       ├── TEMPLATES/
│       └── GUIDES/
│           ├── WAYPI_GUIDE.md
├── Way of pi/
│   └── PI_CODING_AGENT_GUIDE.md
└── Shared/
    └── tools/
        ├── bash/
        └── python/
            ├── waypi.py
            └── waypi_api.py
```

### 6. Recommended Workflow

#### For New Projects
1. Create project directory:
   ```bash
   mkdir -p /home/zerwiz/CodeP/WayPi/waypi/src/myproject
   ```

2. Initialize environment:
   ```bash
   cd /home/zerwiz/CodeP/WayPi/waypi
   source bin/activate
   ```

3. Start coding:
   ```bash
   mywaypi init
   ```

#### For Code Review
1. Analyze code:
   ```bash
   mywaypi review <filename>
   ```

2. Generate tests:
   ```bash
   mywaypi test-create <filename>
   ```

#### For Documentation
1. Generate docs:
   ```bash
   mywaypi docs <source>
   ```

2. Generate API docs:
   ```bash
   mywaypi api-docs
   ```

### 7. Best Practices

#### File Naming
- Use snake_case for Python files
- Use kebab-case for directories
- Include project prefix in filenames
- Add descriptive names

#### Directory Usage
- **/waypi/** - Main working directory
- **/src/** - Source code
- **/tests/** - Test files
- **/docs/** - Documentation
- **/logs/** - Log files

#### Version Control
```bash
git init
git add .
git commit -m "Initial commit"
```

### 8. Security Practices

#### Secure Coding
- Validate all inputs
- Sanitize data
- Use parameterized queries
- Implement proper error handling

#### Tool Safety
- Verify tool permissions
- Check dependencies
- Run security scans
- Use trusted sources only

### 9. Getting Help

#### Documentation
- Read `waypi/README.md`
- Check `Documentation/GUIDES/`
- Review inline docstrings

#### Community
- Check project issue trackers
- Look at code examples
- Review best practices

### 10. Troubleshooting

#### Common Issues
- **Virtual environment not found**: Run `source bin/activate`
- **Module not found**: Run `pip install -e .`
- **Tool not found**: Add to PATH or install
- **Permission denied**: Use `sudo` or `chown`

#### Error Resolution
1. Check error messages
2. Review documentation
3. Check logs
4. Seek community help

---

**Generated for Way of Pi Coding Agent**
**Version: 1.0**
**Updated: $(date)**