"""Read a picked catalog report with the standard library only; data checks need no image packages."""
import json


def picked_base_report(path, selection):
    if not path:
        return None
    base_report = json.loads(path.read_text())
    kinds = {kind: sum(e['kind'] == kind for e in selection['entries']) for kind in ('idle', 'turn', 'attack', 'move')}
    if (base_report.get('catalogSha256') != selection['catalogSha256'] or base_report.get('faults') != []
            or base_report.get('failed') != {} or base_report.get('runtimePng') != 'pass'
            or base_report.get('framesWithNoPickColour', {}).get('total') != 0
            or base_report.get('selectionKinds') != kinds):
        raise ValueError('the base report does not prove a clean build of this pin')
    return base_report
