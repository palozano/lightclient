all:
	tsc && node dist/index.js

clean:
	rm -r node_modules/.cache/default-development
