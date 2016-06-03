import React, { Component, PropTypes } from 'react'
import {Collapse} from 'react-bootstrap';
import LoadingIcon from '../LoadingIcon'
import * as API from '../../api'

export default class Task extends Component {

  static propTypes = {
    task: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {open: false, runTasks: [], historyTasks: []};
  }

  componentDidMount () {
    const {task} = this.props

    if (task.run_ids && task.run_ids.length > 0) {
      let temp = task.run_ids

      Promise.all(temp.map((id, idx) => {
        return API.getPipelineStatus(task.slug, id)
          .then((result) => {
            return {status: result.status, id: id}
          })
      }))
      .then((result) => {
        this.setState({
          historyTasks: result
        })
      })

      API.getPipelineLog(task.slug, task.run_ids[0])
        .then((result) => {
          this.setState({taskLog: result.output})
        })
    }
  }

  onRun () {
    const {task} = this.props
    let tmp = this.state.runTasks
    this.setState({ open: !this.state.open })

    API.runPipeline(task.slug)
      .then((data) => {
        console.log(data)
        tmp.unshift({status: 'running', id: data.task_id})
        this.setState({
          taskId: data.task_id,
          running: true,
          runTasks: tmp
        })
        this.pollingLog()
        this.pollingStatus()
      })
  }

  toggleMenu () {
    this.setState({ open: !this.state.open })
  }

  pollingStatus () {
    if (this.state.running) {
      if (this.statusTimer) {
        clearTimeout(this.statusTimer)
      }
      this.statusTimer = setTimeout(this.getStatus.bind(this), 3000)
    }
  }

  getStatus () {
    const {task} = this.props

    return API.getPipelineStatus(task.slug, this.state.taskId)
      .then((result) => {
        if (result.status === 'success') {
          this.setState({running: false, status: 'success'})
        }
      })

  }

  pollingLog () {
    if (this.state.running) {
      if (this.logTimer) {
        clearTimeout(this.logTimer)
      }
      this.logTimer = setTimeout(this.getLog.bind(this), 1000)
    }
  }

  getLog () {
    const {task} = this.props
    return API.getPipelineLog(task.slug, this.state.taskId)
      .then((result) => {
        this.setState({taskLog: result.output})
      })

  }

  render () {
    const {task} = this.props
    const {runTasks, historyTasks} = this.state
    let runBtn = <span onClick={::this.onRun}><svg className='icon icon-run'><use xlinkHref='#icon-play2'></use></svg></span>
    let runSpinnerBtn = <svg className='icon icon-running spinning'><use xlinkHref='#icon-spinner9'></use></svg>

    let pastJobs = runTasks.concat(historyTasks).map((item, index) => {
      return (
        <li key={'historyTasks'+index} className={index === 0 ? 'active' : ''}>
          <span>
          {item.status === 'success'
            ? <svg className='icon icon-checkmark'><use xlinkHref='#icon-checkmark'></use></svg>
            : <svg className='icon icon-cross'><use xlinkHref='#icon-cross'></use></svg>}
          </span>
          <span className='job-id'>{item.id}</span>
        </li>
      )
    })

    return (
      <div className='wrapper'>
        <div className='panel'>
          <div className='task panel-content'>
            <div className='task-action'>
              {!this.state.running && runBtn}
              {this.state.running && runSpinnerBtn}
            </div>
            <div className='task-summary'>
              <div className='title'>{task.slug || '2344ddfs'}</div>
              {this.state.running && <p><small>Task is running</small></p>}
              {this.state.status === 'success' && <p><small>Task run successfully</small></p>}
            </div>
          </div>
          <div className='panel-control'>
            {!this.state.open && <span onClick={::this.toggleMenu}><svg className='icon icon-menu'><use xlinkHref='#icon-menu'></use></svg></span>}
            {this.state.open && <span onClick={::this.toggleMenu}><svg className='icon icon-cross'><use xlinkHref='#icon-cross'></use></svg></span>}
          </div>
        </div>
        <Collapse in={this.state.open}>
          <section className='task-details'>
            <div className='mui-row'>
            <nav className='mui-col-md-3'>
              <ul className='mui-list--unstyled'>
                {pastJobs}
              </ul>
            </nav>
            <div className='details mui-col-md-9'>
              <p className='logs'>
                {this.state.taskLog}
              </p>
            {this.state.running && <span className='loading'><LoadingIcon /></span> }
            </div>
            </div>
            </section>
        </Collapse>
      </div>
    );
  }
};

