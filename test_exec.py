import urllib.request
import json

print("Fetching workflows...")
req = urllib.request.Request("http://localhost:8000/workflows")
try:
    with urllib.request.urlopen(req) as response:
        workflows = json.loads(response.read().decode())
        print(f"Workflows count: {len(workflows)}")
        if workflows:
            workflow_id = workflows[0]["workflow_id"]
            print(f"Executing workflow: {workflow_id}")
            
            exec_req = urllib.request.Request(f"http://localhost:8000/workflows/{workflow_id}/execute", method="POST")
            try:
                with urllib.request.urlopen(exec_req) as exec_res:
                    print("Execute response:", exec_res.status)
                    print(json.dumps(json.loads(exec_res.read().decode()), indent=2))
            except Exception as e:
                print("Execute failed:", e)

            list_req = urllib.request.Request(f"http://localhost:8000/workflows/{workflow_id}/executions")
            try:
                with urllib.request.urlopen(list_req) as list_res:
                    data = json.loads(list_res.read().decode())
                    print("Executions response:", list_res.status, len(data))
                    print(json.dumps(data, indent=2))
            except Exception as e:
                print("List failed:", e)
except Exception as e:
    print(f"Failed to fetch workflows: {e}")
