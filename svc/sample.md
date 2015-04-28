---
# yaml frontmatter for jekyll processing
layout: svc
title: Sample Service
item: sample
svc:
  code: sample
  label: Sample Service
  description: 
    this is a sample service
    blablabla
    bli bli bli
  domain: tech
---

Here is full markdown description of the service "{{site.data.svc[page.item].description}}"
