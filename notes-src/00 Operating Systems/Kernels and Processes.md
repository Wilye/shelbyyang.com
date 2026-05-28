Operating Systems Principles & Practice Volume I: Kernels and Processes - Anderson and Dahlin
***

> [!question] What is an Operating System?

An operating system is the layer of software that manages a computer's resources for its users and their applications.

![[Pasted image 20260524123531.png#center | 500]]

<u>Roles the OS plays</u>
1. referee: manages shared resources, isolates programs, protects from viruses
2. illusionist: provides an abstraction of physical hardware, nearly infinite memory, program has processor to itself
3. glue: provides set of common services (e.g. interface for application <-> hardware input and output)

Shared Resources Challanges
1. resource allocation
	```
	while (true) {
		;
	}
	```
	should not cause computer to lock up
2. isolation: an error in one application shouldn't disrupt other applications or the OS itself (==fault isolation==)
	- requires restricting the behavior of applications to less than the full power of the underlying hardware
3. communication: between different apps and users
	- isolation sets up boundaries
	- communication allows those boundaries to be crossed in safe ways


==Virtualization==: provides an application with the illusion of resources that are not physically present
- processors, memory, network packet drops, byte addressable files, 

==Virtual machine==: running the OS as an application on top of the OS

Provides common services to facilitate sharing among applications
- e.g. web server must be able to read the file that the text editor wrote
- OS provides a standard way for applications to pass messages and to share memory
- most applications can ignore differences in devices, interfaces, sensors, and versions with a ==generic interface== provided by the OS

OS addresses challenges found in other domains
- cloud computing
- web browsers
- multi user database systems
	- techniques in chapter 14 were originally developed for database systems

OS design evaluation criteria
- reliability and availability
- security
- portability
- performance
- adoption

Single user operating system -> batch operating system (load, run, unload) -> multitasking operating system (multiple programs at once)

Time sharing OS: user types input, causes an interrupt, handler reads the event, and queues it

---
## The Kernel Abstraction

==Protection==: the isolation of potentially misbehaving applications and users so they do not corrupt other applications or the OS itself

Protection achieves a subset of the aforementioned goals / evaluation criteria
- reliability
	- prevents bugs in one program from causing crashes in other programs or in the OS
- security
	- prevent untrusted code from modifying system state
- privacy
	- each user must be limited to only the data that they are permitted access to 
- fair resource allocation
	- limit the amount of resources assigned to each application or user

> [!info] The OS Kernel implements protection.

==Kernel==: the lowest level of software running on the system
Kernel is trusted, everything else is untrusted

![[Pasted image 20260524144229.png#center | 400]]

==Process==: execution of an application program with restricted rights
- abstraction for protected execution provided by the kernel
- kernel mediates and check's each process's access to hardware
When we are running the OS kernel, it can do anything.
When we are running a user application, the process's behavior is restricted.

![[Pasted image 20260527160939.png#center]]

Page 51/164

<u>Writing and compiling a program</u>:
1. Programmer types code in high level language
2. Compiler converts code into machine instructions
3. Compiler stores instructions in a file called the program's ==executable image==
	- compiler defines any static data the program needs + initial values, and includes in executable image 

<u>To run the program</u>:
1. OS copies the instructions and data from the executable image into physical memory
2. OS sets aside a memory region (the ==execution stack==) to hold the state of local variables during procedure calls
3. OS sets aside a memory region (the ==heap==) for any dynamically allocated data structures the program might need
4. OS can start the program by setting the stack pointer and jumping to the program's first instruction
The OS itself is already loaded into memory with its own stack and heap
The compiler itself is also just another program (OS starts the compiler by copying its executable image into memory and jumping to its first instruction)

Running multiple copies of the same program:
- OS keeps a single copy of a program's instructions
- OS maintains separate copies of program's data, heap, and stack

> [!info] A process is an *instance* of a program
- each program can have 0, 1, or more processes executing it

The OS keeps track of processes via the ==Process Control Block (PCB)==
- stores information the OS needs about a process
- where is it stored in memory?
- where is the executable image on disk?
- which user asked to execute it?
- what privileges does the process have?

Each ==thread== has its own program counter and stack, but operates on the same code and data as other threads. 
- concurrent activities within a process is a thread

Once a program is loaded into memory and the OS starts the process
- processor fetches, decodes, and executes each instruction
- instructions: multiplying registers and putting results in another register, read or write locations in memory, branches, etc.
==Dual-mode operation==: represented by a single bit in the processor status register
- ==user mode==: processor checks each instruction before executing it to verify that it is permitted
- ==kernel mode==: OS executes with protection checks turned off
![[Pasted image 20260527165023.png#center]]
The program counter and mode bit control the processor's operation

Three principles to so the OS can protect applications and users from one another:
- Privileged instructions (all potentially unsafe instructions are prohibited in user mode)
- Memory protection (memory accesses outside of valid region are prohibited in user mode)
- Timer interrupts (let kernel regain control from process)

Processor status registor:
- 1: kernel mode
- 0: user mode
Note: Kind of misleading?
- In x86, privilege level is encoded in CPL (current privilege level), the bottom 2 bits of the CS (code segment)
	- CPL 0 = kernel
	- CPL 3 = user

Processes can change their privilege level by executing a system call (transfers control to kernel), otherwise, cannot change privilege level.

Instructions available in kernel mode, but not in user mode, are ==privileged instructions==.
- e.g. change set of memory locations it can access, disable and enable interrupts
==Processor exception== if an application attempts to access restricted memory or attempts to change its privilege level.

### Memory Protection

> [!info] Both the OS and the application are resident in memory at the same time
- application must be in memory to execute
- OS must be there to start the program and handle interrupts, processor exceptions, or system calls


OS must be able to configure the hardware so that each application process can read and write only its own memory

Early approach: ==base + bound==

![[Pasted image 20260527225327.png#center]]

A processor uses two extra registers for base and bound
Base: start of the process's memory region in physical memory
Bound: endpoint

These registers can be changed only by privileged instructions (kernel mode).

Every time the processor fetches an instruction, it checks the address of the PC to see if it's between the base and bound registers.
- if so: proceed
- if not: hardware raises an exception
For instructions that are reads / writes to memory, the processor checks each memory reference against the base and bound registers.

OS kernel executes without the base and bound registers.

When a program starts up, kernel finds a free block of contiguous physical memory with enough room to store the entire program, data, heap, and execution stack.

Side quest:
![[Pasted image 20260527225903.png#center]]
It just moves the stack pointer 🤣 boi am I stupid I was thinking how is it going to have enough registers for all my stack allocated variables.

==Memory mapped devices==
- OS controls input/output devices (e.g. disk, network, or keyboard) by reading and writing to special memory locations
- Each device monitors the memory bus for the address assigned to it, and when it sees its address, the device triggers the desired I/O operation

<u>Cons of base + bound</u>
- no expandable heap + stack once the program starts
- memory cannot be shared between different processes
- program may be loaded at different locations depending on what other programs are running at the same time, so the kernel must change every instruction and data location that refers to an absolute address each time the program is loaded into memory
- memory fragmentation

So we have ==virtual addresses==!! (indirection 😎)
- every program's memory starts at 0
- each process thinks it has the entire machine to itself
- hardware translates virtual addresses to physical addresses
- let the heap and stack start at separate ends of virtual address space
	- if either grows beyond initially allocated region, OS can move it to a different larger region in physical memory, but keep the same VA
![[Pasted image 20260527231108.png#center]]

With VA, multiple copies of the same program run simultaneously, each program will see the same virtual address locations* for its variables, even though they map to different physical addresses.
- \*with no address randomization

### Timer Interrupts

If the application becomes unresponsive (e.g. infinite loop) or the user wants to stop the application, then the OS must be able to *regain control*

If the application controls the processor, the OS is not running on that processor

> [!important] The kernel is not always running! But it has the illusion of always running (even kernel threads) due to interrupts

Hardware timer: set to interrupt the processor after a specified delay
- per processor / core / CPU (interchangeable terms)
- resetting the timer is a privileged operation

Main idea: stops poorly behaved programs that don't yield, or programs that run into infinite loops

When the timer interrupt occurs, hardware transfers control from the user process to the kernel
- in most cases, after resetting the timer, the OS resumes execution of the process, setting the mode, program counter, and registers back to the values they had immediately before the interrupt occurred

#### Types of Mode Transfer

> [!question] How to safely transition from executing a user process to kernel? And vice versa?

<u>User to kernel</u>
- interrupts
- processor exceptions
- system calls

Interrupts are asynchronous. Can be triggered by an external event and transfer to kernel mode after *any* user mode instruction.
- external events: timer, pressing a key, finished rendering a frame, etc.

Processor exceptions and system calls are synchronous events triggered by process execution.
- ==trap==: any synchronous transfer of control from user mode to the kernel

==Interrupt==
- **asynchronous signal to the processor some external event has occurred that may require its attention**
- as the processor executes instructions, checks for whether an interrupt has arrived
- if so, it completes or stalls any instructions that are in progress
- instead of fetching the next instruction, processor hardware saves the current execution state, and starts executing at a specifically designated interrupt handler in the kernel
- other processors are not affected by interrupts happening on a different processor
- each different type of interrupt has its own handler
Alternative to interrupt, ==polling==: kernel loops, checking each I/O device to see if an event has occurred that requires handling
- if kernel is polling, not available to run user level code
==Interprocesser interrupts==: processor can send interrupt to any other processor, used to coordinate actions across the processors

==Processor Exception==
- **hardware event caused by user program behavior that causes control transfer to kernel**
- finishes all previous instructions, saves current execution state, and starts running at a specially designated exception handler
- e.g. process attempts a privileged instruction, accesses memory outside of its region, divide by 0
- OS halts the process and returns an error code to the user
- only stops execution on the processor triggering the exception
Also triggered by setting a breakpoint in a program
- replaces the machine instruction in memory with a special instruction that invokes a trap
- when it reaches breakpoint, the kernel restores the old instruction and transfers control to the debugger

==System Call==
- user process transition into kernel voluntarily to request the kernel perform an operation on the user's behalf
- **procedure provided by the kernel that can be called from the user level**
- usually a `trap` or `syscall` instruction
-  starts executing in the kernel at a predefined handler
- e.g. establish connection to web server, send or receive packets over network, create or delete files
- caller only concerned with interface